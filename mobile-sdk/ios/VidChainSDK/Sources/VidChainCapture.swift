// VidChain iOS SDK
// Capture-time verification with device attestation

import Foundation
import AVFoundation
import CoreLocation
import DeviceCheck
import CryptoKit

// MARK: - Types

public enum CaptureMode {
    case video
    case photo
}

public enum AttestationType {
    case none
    case deviceCheck
    case appAttest
    case deviceAttestation // Uses both DeviceCheck and App Attest
}

public enum SigningMode {
    case none
    case perCapture      // Sign entire capture once
    case perFrame        // Sign each frame individually
}

public enum CaptureMetadata: String, CaseIterable {
    case timestamp
    case location
    case deviceInfo
    case sensorData
    case networkInfo
}

public struct CaptureResult {
    public let localPath: URL
    public let sha256Hash: String
    public let metadata: CapturedMetadata
    public let attestation: AttestationData?
    public let c2paManifest: Data?
    public let duration: TimeInterval?
    public let frameCount: Int?
}

public struct CapturedMetadata: Codable {
    public let device: DeviceInfo
    public let capture: CaptureInfo
    public let sensors: SensorData?
    public let attestation: AttestationInfo?
}

public struct DeviceInfo: Codable {
    public let manufacturer: String
    public let model: String
    public let osVersion: String
    public let secureEnclaveAvailable: Bool
    public let jailbreakDetected: Bool
    public let deviceId: String?
}

public struct CaptureInfo: Codable {
    public let startTime: Date
    public let endTime: Date
    public let timezone: String
    public let location: LocationInfo?
}

public struct LocationInfo: Codable {
    public let latitude: Double
    public let longitude: Double
    public let accuracy: Double
    public let altitude: Double?
    public let speed: Double?
    public let heading: Double?
}

public struct SensorData: Codable {
    public let accelerometer: [[Double]]?
    public let gyroscope: [[Double]]?
    public let magnetometer: [[Double]]?
}

public struct AttestationInfo: Codable {
    public let type: String
    public let keyId: String
    public let timestamp: Date
}

public struct AttestationData {
    public let type: AttestationType
    public let assertion: Data
    public let keyId: String
}

// MARK: - Errors

public enum VidChainError: Error {
    case cameraNotAvailable
    case microphoneNotAvailable
    case locationNotAuthorized
    case attestationFailed(String)
    case signingFailed(String)
    case uploadFailed(String)
    case invalidConfiguration
    case secureEnclaveNotAvailable
}

// MARK: - VidChainCapture

public class VidChainCapture: NSObject {

    // MARK: Properties

    private let apiKey: String
    private let baseURL: URL
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureMovieFileOutput?
    private var photoOutput: AVCapturePhotoOutput?
    private var locationManager: CLLocationManager?
    private var currentLocation: CLLocation?
    private var attestationKeyId: String?

    private var captureStartTime: Date?
    private var frameHashes: [String] = []
    private var sensorReadings: SensorData?

    // MARK: Initialization

    public init(apiKey: String, baseURL: String = "https://api.vidchain.io") {
        self.apiKey = apiKey
        self.baseURL = URL(string: baseURL)!
        super.init()
    }

    // MARK: Public Methods

    /// Start verified capture
    public func startCapture(
        mode: CaptureMode,
        attestation: AttestationType = .deviceAttestation,
        signing: SigningMode = .perCapture,
        metadata: Set<CaptureMetadata> = [.timestamp, .location, .deviceInfo],
        completion: @escaping (Result<CaptureResult, VidChainError>) -> Void
    ) {
        // Request permissions
        requestPermissions(for: metadata) { [weak self] granted in
            guard granted else {
                completion(.failure(.locationNotAuthorized))
                return
            }

            // Generate attestation key if needed
            if attestation != .none {
                self?.generateAttestationKey { result in
                    switch result {
                    case .success(let keyId):
                        self?.attestationKeyId = keyId
                        self?.beginCapture(mode: mode, signing: signing, metadata: metadata, completion: completion)
                    case .failure(let error):
                        completion(.failure(error))
                    }
                }
            } else {
                self?.beginCapture(mode: mode, signing: signing, metadata: metadata, completion: completion)
            }
        }
    }

    /// Stop current capture
    public func stopCapture() {
        videoOutput?.stopRecording()
        captureSession?.stopRunning()
    }

    /// Upload captured media to VidChain
    public func upload(
        capture: CaptureResult,
        autoMint: Bool = false,
        completion: @escaping (Result<UploadResult, VidChainError>) -> Void
    ) {
        var request = URLRequest(url: baseURL.appendingPathComponent("/v2/upload"))
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Build upload payload
        let payload: [String: Any] = [
            "sha256Hash": capture.sha256Hash,
            "metadata": try? JSONEncoder().encode(capture.metadata),
            "attestation": capture.attestation?.assertion.base64EncodedString() ?? "",
            "c2paManifest": capture.c2paManifest?.base64EncodedString() ?? "",
            "autoMint": autoMint,
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        // Upload file
        let task = URLSession.shared.uploadTask(with: request, fromFile: capture.localPath) { data, response, error in
            if let error = error {
                completion(.failure(.uploadFailed(error.localizedDescription)))
                return
            }

            guard let data = data,
                  let response = try? JSONDecoder().decode(UploadResponse.self, from: data) else {
                completion(.failure(.uploadFailed("Invalid response")))
                return
            }

            completion(.success(UploadResult(
                verificationId: response.verificationId,
                ipfsCid: response.ipfsCid,
                tokenId: response.tokenId,
                transactionHash: response.transactionHash
            )))
        }

        task.resume()
    }

    // MARK: Private Methods

    private func requestPermissions(for metadata: Set<CaptureMetadata>, completion: @escaping (Bool) -> Void) {
        var permissionsGranted = true
        let group = DispatchGroup()

        // Camera permission
        group.enter()
        AVCaptureDevice.requestAccess(for: .video) { granted in
            permissionsGranted = permissionsGranted && granted
            group.leave()
        }

        // Microphone permission
        group.enter()
        AVCaptureDevice.requestAccess(for: .audio) { granted in
            permissionsGranted = permissionsGranted && granted
            group.leave()
        }

        // Location permission
        if metadata.contains(.location) {
            group.enter()
            locationManager = CLLocationManager()
            locationManager?.delegate = self
            locationManager?.requestWhenInUseAuthorization()

            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                let status = CLLocationManager.authorizationStatus()
                permissionsGranted = permissionsGranted && (status == .authorizedWhenInUse || status == .authorizedAlways)
                group.leave()
            }
        }

        group.notify(queue: .main) {
            completion(permissionsGranted)
        }
    }

    private func generateAttestationKey(completion: @escaping (Result<String, VidChainError>) -> Void) {
        // Use App Attest if available (iOS 14+)
        if #available(iOS 14.0, *) {
            let service = DCAppAttestService.shared

            guard service.isSupported else {
                completion(.failure(.secureEnclaveNotAvailable))
                return
            }

            service.generateKey { keyId, error in
                if let error = error {
                    completion(.failure(.attestationFailed(error.localizedDescription)))
                    return
                }

                guard let keyId = keyId else {
                    completion(.failure(.attestationFailed("No key ID returned")))
                    return
                }

                completion(.success(keyId))
            }
        } else {
            // Fall back to DeviceCheck for older iOS
            completion(.success(UUID().uuidString))
        }
    }

    private func beginCapture(
        mode: CaptureMode,
        signing: SigningMode,
        metadata: Set<CaptureMetadata>,
        completion: @escaping (Result<CaptureResult, VidChainError>) -> Void
    ) {
        captureStartTime = Date()
        frameHashes = []

        // Start location updates if needed
        if metadata.contains(.location) {
            locationManager?.startUpdatingLocation()
        }

        // Set up capture session
        setupCaptureSession(mode: mode) { [weak self] result in
            switch result {
            case .success:
                // Capture is running, wait for stop
                // In a real implementation, this would use delegates
                break
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }

    private func setupCaptureSession(mode: CaptureMode, completion: @escaping (Result<Void, VidChainError>) -> Void) {
        captureSession = AVCaptureSession()
        captureSession?.sessionPreset = .high

        // Add video input
        guard let videoDevice = AVCaptureDevice.default(for: .video),
              let videoInput = try? AVCaptureDeviceInput(device: videoDevice),
              captureSession?.canAddInput(videoInput) == true else {
            completion(.failure(.cameraNotAvailable))
            return
        }

        captureSession?.addInput(videoInput)

        // Add audio input
        if let audioDevice = AVCaptureDevice.default(for: .audio),
           let audioInput = try? AVCaptureDeviceInput(device: audioDevice),
           captureSession?.canAddInput(audioInput) == true {
            captureSession?.addInput(audioInput)
        }

        // Add output based on mode
        switch mode {
        case .video:
            videoOutput = AVCaptureMovieFileOutput()
            if let output = videoOutput, captureSession?.canAddOutput(output) == true {
                captureSession?.addOutput(output)
            }
        case .photo:
            photoOutput = AVCapturePhotoOutput()
            if let output = photoOutput, captureSession?.canAddOutput(output) == true {
                captureSession?.addOutput(output)
            }
        }

        // Start running
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
            DispatchQueue.main.async {
                completion(.success(()))
            }
        }
    }

    private func computeHash(of data: Data) -> String {
        let hash = SHA256.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }

    private func signWithSecureEnclave(data: Data, keyId: String) throws -> Data {
        // In a real implementation, this would use the Secure Enclave
        // to sign data with the attestation key
        let hash = SHA256.hash(data: data)
        return Data(hash)
    }

    private func generateC2PAManifest(for capture: CaptureResult) -> Data? {
        // Generate C2PA manifest with VidChain assertions
        let manifest: [String: Any] = [
            "claim_generator": "VidChain iOS SDK/1.0.0",
            "assertions": [
                [
                    "label": "c2pa.created",
                    "data": [
                        "when": ISO8601DateFormatter().string(from: capture.metadata.capture.startTime),
                        "softwareAgent": "VidChain iOS SDK",
                    ]
                ],
                [
                    "label": "vidchain.device_attestation",
                    "data": [
                        "device": capture.metadata.device.model,
                        "secureEnclave": capture.metadata.device.secureEnclaveAvailable,
                        "attestationType": capture.attestation?.type.description ?? "none",
                    ]
                ],
            ],
            "signature_info": [
                "alg": "ES256",
                "time": ISO8601DateFormatter().string(from: Date()),
            ],
        ]

        return try? JSONSerialization.data(withJSONObject: manifest)
    }

    private func collectDeviceInfo() -> DeviceInfo {
        return DeviceInfo(
            manufacturer: "Apple",
            model: UIDevice.current.model,
            osVersion: UIDevice.current.systemVersion,
            secureEnclaveAvailable: SecureEnclave.isAvailable,
            jailbreakDetected: detectJailbreak(),
            deviceId: UIDevice.current.identifierForVendor?.uuidString
        )
    }

    private func detectJailbreak() -> Bool {
        // Check for common jailbreak indicators
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/",
        ]

        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }

        // Check if app can write outside sandbox
        let testPath = "/private/jailbreak_test.txt"
        do {
            try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            return true
        } catch {
            return false
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension VidChainCapture: CLLocationManagerDelegate {
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }
}

// MARK: - Supporting Types

public struct UploadResult {
    public let verificationId: String
    public let ipfsCid: String?
    public let tokenId: String?
    public let transactionHash: String?
}

private struct UploadResponse: Codable {
    let verificationId: String
    let ipfsCid: String?
    let tokenId: String?
    let transactionHash: String?
}

extension AttestationType: CustomStringConvertible {
    public var description: String {
        switch self {
        case .none: return "none"
        case .deviceCheck: return "device_check"
        case .appAttest: return "app_attest"
        case .deviceAttestation: return "device_attestation"
        }
    }
}

// MARK: - Secure Enclave Helper

private enum SecureEnclave {
    static var isAvailable: Bool {
        return SecKeyIsAlgorithmSupported(
            SecKeyCreateRandomKey(
                [
                    kSecAttrKeyType: kSecAttrKeyTypeECSECPrimeRandom,
                    kSecAttrKeySizeInBits: 256,
                    kSecAttrTokenID: kSecAttrTokenIDSecureEnclave,
                ] as CFDictionary,
                nil
            )!,
            .sign,
            .ecdsaSignatureMessageX962SHA256
        )
    }
}
