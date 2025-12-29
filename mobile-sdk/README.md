# VidChain Mobile SDK

Capture-time verification SDK for iOS, Android, and React Native. Provides cryptographically signed video and photo capture with device attestation.

## Features

- **Secure Capture**: Videos and photos signed at capture time using device secure enclave
- **Device Attestation**: Proves the capture occurred on an authentic, non-compromised device
- **Automatic Metadata**: GPS, timestamp, device info, and sensor data embedded
- **C2PA Integration**: Generates C2PA-compliant manifests at capture
- **Seamless Upload**: Direct upload to VidChain with verification

## Installation

### iOS (Swift Package Manager)

```swift
dependencies: [
    .package(url: "https://github.com/vidchain/vidchain-ios-sdk.git", from: "1.0.0")
]
```

### iOS (CocoaPods)

```ruby
pod 'VidChainSDK', '~> 1.0'
```

### Android (Gradle)

```kotlin
implementation("com.vidchain:sdk:1.0.0")
```

### React Native

```bash
npm install @vidchain/react-native-sdk
# or
yarn add @vidchain/react-native-sdk
```

## Quick Start

### iOS

```swift
import VidChainSDK

class CaptureViewController: UIViewController {
    let vidchain = VidChainCapture(apiKey: "your-api-key")

    func startVerifiedRecording() {
        vidchain.startCapture(
            mode: .video,
            attestation: .deviceAttestation,
            signing: .perFrame,
            metadata: [.timestamp, .location, .deviceInfo]
        ) { result in
            switch result {
            case .success(let capture):
                print("Capture complete: \(capture.localPath)")
                self.uploadToVidChain(capture)
            case .failure(let error):
                print("Capture failed: \(error)")
            }
        }
    }
}
```

### Android

```kotlin
import com.vidchain.sdk.VidChainCapture
import com.vidchain.sdk.CaptureMode
import com.vidchain.sdk.AttestationType

class CaptureActivity : AppCompatActivity() {
    private val vidchain = VidChainCapture(apiKey = "your-api-key")

    fun startVerifiedRecording() {
        vidchain.startCapture(
            mode = CaptureMode.VIDEO,
            attestation = AttestationType.KEYSTORE,
            signing = SigningMode.PER_FRAME,
            metadata = setOf(
                CaptureMetadata.TIMESTAMP,
                CaptureMetadata.LOCATION,
                CaptureMetadata.DEVICE_INFO
            )
        ).collect { result ->
            when (result) {
                is CaptureResult.Success -> uploadToVidChain(result.capture)
                is CaptureResult.Error -> handleError(result.error)
            }
        }
    }
}
```

### React Native

```typescript
import { VidChainCapture, CaptureMode, AttestationType } from '@vidchain/react-native-sdk';

const App = () => {
  const vidchain = new VidChainCapture({ apiKey: 'your-api-key' });

  const startVerifiedRecording = async () => {
    try {
      const capture = await vidchain.startCapture({
        mode: CaptureMode.VIDEO,
        attestation: AttestationType.DEVICE,
        metadata: ['timestamp', 'location', 'deviceInfo'],
      });

      console.log('Capture complete:', capture.localPath);
      await vidchain.upload(capture);
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  return (
    <VidChainCameraView
      onCapture={startVerifiedRecording}
      showOverlay={true}
    />
  );
};
```

## SDK Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VidChain SDK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Capture    │  │   Signing    │  │   Upload     │          │
│  │   Module     │  │   Module     │  │   Module     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Secure Enclave / TEE                     │      │
│  │  • Private key storage                                │      │
│  │  • Frame signing                                      │      │
│  │  • Device attestation                                 │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              C2PA Manifest Generator                  │      │
│  │  • Create assertions                                  │      │
│  │  • Sign manifest                                      │      │
│  │  • Embed in media                                     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Device Attestation

### iOS
- Uses DeviceCheck and App Attest APIs
- Hardware-backed key stored in Secure Enclave
- Verifies app integrity and device authenticity

### Android
- Uses Play Integrity API (successor to SafetyNet)
- Hardware-backed keys in Android Keystore
- Verifies device isn't rooted/compromised

## Captured Metadata

```json
{
  "device": {
    "manufacturer": "Apple",
    "model": "iPhone 15 Pro",
    "osVersion": "iOS 17.2",
    "secureEnclave": true,
    "jailbreakDetected": false
  },
  "capture": {
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:32:45.000Z",
    "timezone": "America/New_York",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 5,
      "altitude": 10
    }
  },
  "sensors": {
    "accelerometer": [...],
    "gyroscope": [...],
    "magnetometer": [...]
  },
  "attestation": {
    "type": "apple_app_attest",
    "assertion": "base64...",
    "keyId": "..."
  }
}
```

## API Reference

See the full API documentation:
- [iOS API Reference](./ios/README.md)
- [Android API Reference](./android/README.md)
- [React Native API Reference](./react-native/README.md)

## Security Considerations

1. **API Key Protection**: Never hardcode API keys. Use secure storage.
2. **SSL Pinning**: Enable SSL pinning for production builds.
3. **Jailbreak/Root Detection**: SDK detects compromised devices.
4. **Key Rotation**: Private keys can be rotated without losing history.

## License

Copyright 2024 VidChain, Inc. All rights reserved.
Commercial license required for production use.
