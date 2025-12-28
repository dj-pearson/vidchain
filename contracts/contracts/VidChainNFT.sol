// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VidChainNFT
 * @dev Video authenticity verification NFT contract for VidChain platform
 * @notice This contract mints NFTs that serve as immutable proof of video authenticity
 *
 * Features:
 * - ERC-721 compliant NFTs for video verification
 * - EIP-2981 royalty standard with per-token creator royalties
 * - Immutable original creator tracking (never changes on transfer)
 * - Gas-optimized storage for video records
 * - Duplicate prevention via hash mapping
 * - Marketplace integration support
 * - Licensing metadata support
 */
contract VidChainNFT is ERC721, IERC2981, Ownable, AccessControl, ReentrancyGuard {
    using Strings for uint256;

    // ============ Roles ============

    /// @dev Role for minting NFTs (granted to platform backend)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Role for marketplace operations
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    // ============ Structs ============

    /**
     * @dev Gas-optimized struct for storing video verification data
     * Uses storage packing for efficiency
     */
    struct VideoRecord {
        bytes32 sha256Hash;          // SHA-256 hash of the video content
        bytes32 ipfsCidHash;         // keccak256 hash of IPFS CID
        address originalCreator;      // IMMUTABLE - never changes on transfer
        uint64 timestamp;            // Verification timestamp
        uint32 version;              // Schema version for future upgrades
    }

    /**
     * @dev Per-token royalty configuration
     */
    struct RoyaltyConfig {
        address receiver;            // Royalty receiver (usually original creator)
        uint96 royaltyBps;          // Royalty in basis points
    }

    /**
     * @dev Licensing terms for the video
     */
    struct LicensingTerms {
        bool commercialUse;          // Allow commercial use
        bool attributionRequired;    // Require attribution
        bool modificationsAllowed;   // Allow modifications
        bool mediaLicensingEnabled;  // Available for media organization licensing
    }

    // ============ State Variables ============

    /// @dev Mapping from token ID to video record
    mapping(uint256 => VideoRecord) public videoRecords;

    /// @dev Mapping from SHA-256 hash to token ID (prevents duplicate mints)
    mapping(bytes32 => uint256) public hashToTokenId;

    /// @dev Per-token royalty configuration
    mapping(uint256 => RoyaltyConfig) public tokenRoyalties;

    /// @dev Per-token licensing terms
    mapping(uint256 => LicensingTerms) public tokenLicensing;

    /// @dev Counter for token IDs (starts at 1)
    uint256 private _tokenIdCounter;

    /// @dev Default royalty percentage in basis points (500 = 5%)
    uint96 public defaultRoyaltyBps;

    /// @dev Platform royalty percentage in basis points (200 = 2%)
    uint96 public platformRoyaltyBps;

    /// @dev Platform royalty receiver
    address public platformRoyaltyReceiver;

    /// @dev Base URI for token metadata
    string private _baseTokenURI;

    /// @dev Maximum royalty percentage (10%)
    uint96 public constant MAX_ROYALTY_BPS = 1000;

    /// @dev Current schema version
    uint32 public constant SCHEMA_VERSION = 2;

    /// @dev Approved marketplace contract
    address public marketplaceContract;

    // ============ Events ============

    /**
     * @dev Emitted when a video is authenticated and minted
     */
    event VideoAuthenticated(
        uint256 indexed tokenId,
        bytes32 indexed sha256Hash,
        string ipfsCid,
        address indexed creator,
        uint64 timestamp
    );

    /**
     * @dev Emitted when token royalty is updated
     */
    event TokenRoyaltyUpdated(uint256 indexed tokenId, address receiver, uint96 royaltyBps);

    /**
     * @dev Emitted when licensing terms are updated
     */
    event LicensingTermsUpdated(uint256 indexed tokenId, bool commercialUse, bool mediaLicensing);

    /**
     * @dev Emitted when default royalty is updated
     */
    event DefaultRoyaltyUpdated(uint96 newRoyaltyBps);

    /**
     * @dev Emitted when platform royalty is updated
     */
    event PlatformRoyaltyUpdated(address receiver, uint96 royaltyBps);

    /**
     * @dev Emitted when base URI is updated
     */
    event BaseURIUpdated(string newBaseURI);

    /**
     * @dev Emitted when marketplace contract is updated
     */
    event MarketplaceUpdated(address marketplace);

    // ============ Errors ============

    error InvalidHash();
    error InvalidCID();
    error AlreadyMinted();
    error RoyaltyTooHigh();
    error NonexistentToken();
    error ZeroAddress();
    error NotTokenOwner();
    error Unauthorized();

    // ============ Constructor ============

    /**
     * @dev Initializes the contract with default values
     */
    constructor(address _platformReceiver)
        ERC721("VidChain Verified", "VIDC")
        Ownable(msg.sender)
    {
        if (_platformReceiver == address(0)) revert ZeroAddress();

        defaultRoyaltyBps = 500;      // 5% default creator royalty
        platformRoyaltyBps = 200;     // 2% platform royalty
        platformRoyaltyReceiver = _platformReceiver;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // ============ Minting Functions ============

    /**
     * @dev Mints a new video authentication NFT
     * @param _sha256Hash The SHA-256 hash of the video content
     * @param _ipfsCid The IPFS CID where the video is stored
     * @param _to The address to receive the NFT (original creator)
     * @param _royaltyBps Custom royalty for this token (0 for default)
     * @return tokenId The ID of the newly minted NFT
     */
    function mintAuthenticated(
        bytes32 _sha256Hash,
        string calldata _ipfsCid,
        address _to,
        uint96 _royaltyBps
    ) external nonReentrant onlyRole(MINTER_ROLE) returns (uint256) {
        // Validate inputs
        if (_sha256Hash == bytes32(0)) revert InvalidHash();
        if (bytes(_ipfsCid).length == 0) revert InvalidCID();
        if (_to == address(0)) revert ZeroAddress();
        if (hashToTokenId[_sha256Hash] != 0) revert AlreadyMinted();

        uint96 royalty = _royaltyBps > 0 ? _royaltyBps : defaultRoyaltyBps;
        if (royalty > MAX_ROYALTY_BPS) revert RoyaltyTooHigh();

        // Increment counter and mint
        uint256 tokenId = ++_tokenIdCounter;

        // Store video record with original creator (immutable)
        videoRecords[tokenId] = VideoRecord({
            sha256Hash: _sha256Hash,
            ipfsCidHash: keccak256(bytes(_ipfsCid)),
            originalCreator: _to,
            timestamp: uint64(block.timestamp),
            version: SCHEMA_VERSION
        });

        // Store royalty config
        tokenRoyalties[tokenId] = RoyaltyConfig({
            receiver: _to,
            royaltyBps: royalty
        });

        // Default licensing terms
        tokenLicensing[tokenId] = LicensingTerms({
            commercialUse: false,
            attributionRequired: true,
            modificationsAllowed: false,
            mediaLicensingEnabled: false
        });

        // Map hash to token ID for duplicate prevention
        hashToTokenId[_sha256Hash] = tokenId;

        // Mint the NFT
        _safeMint(_to, tokenId);

        // Emit event
        emit VideoAuthenticated(
            tokenId,
            _sha256Hash,
            _ipfsCid,
            _to,
            uint64(block.timestamp)
        );

        return tokenId;
    }

    /**
     * @dev Batch mint multiple video authentication NFTs
     */
    function batchMintAuthenticated(
        bytes32[] calldata _sha256Hashes,
        string[] calldata _ipfsCids,
        address _to,
        uint96 _royaltyBps
    ) external nonReentrant onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        require(_sha256Hashes.length == _ipfsCids.length, "Array length mismatch");
        require(_sha256Hashes.length <= 50, "Max 50 per batch");

        uint96 royalty = _royaltyBps > 0 ? _royaltyBps : defaultRoyaltyBps;
        if (royalty > MAX_ROYALTY_BPS) revert RoyaltyTooHigh();

        uint256[] memory tokenIds = new uint256[](_sha256Hashes.length);

        for (uint256 i = 0; i < _sha256Hashes.length; i++) {
            if (_sha256Hashes[i] == bytes32(0)) revert InvalidHash();
            if (bytes(_ipfsCids[i]).length == 0) revert InvalidCID();
            if (hashToTokenId[_sha256Hashes[i]] != 0) revert AlreadyMinted();

            uint256 tokenId = ++_tokenIdCounter;

            videoRecords[tokenId] = VideoRecord({
                sha256Hash: _sha256Hashes[i],
                ipfsCidHash: keccak256(bytes(_ipfsCids[i])),
                originalCreator: _to,
                timestamp: uint64(block.timestamp),
                version: SCHEMA_VERSION
            });

            tokenRoyalties[tokenId] = RoyaltyConfig({
                receiver: _to,
                royaltyBps: royalty
            });

            tokenLicensing[tokenId] = LicensingTerms({
                commercialUse: false,
                attributionRequired: true,
                modificationsAllowed: false,
                mediaLicensingEnabled: false
            });

            hashToTokenId[_sha256Hashes[i]] = tokenId;
            _safeMint(_to, tokenId);

            emit VideoAuthenticated(
                tokenId,
                _sha256Hashes[i],
                _ipfsCids[i],
                _to,
                uint64(block.timestamp)
            );

            tokenIds[i] = tokenId;
        }

        return tokenIds;
    }

    // ============ Owner Functions ============

    /**
     * @dev Update licensing terms for a token (only current owner)
     */
    function updateLicensingTerms(
        uint256 _tokenId,
        bool _commercialUse,
        bool _attributionRequired,
        bool _modificationsAllowed,
        bool _mediaLicensingEnabled
    ) external {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();

        tokenLicensing[_tokenId] = LicensingTerms({
            commercialUse: _commercialUse,
            attributionRequired: _attributionRequired,
            modificationsAllowed: _modificationsAllowed,
            mediaLicensingEnabled: _mediaLicensingEnabled
        });

        emit LicensingTermsUpdated(_tokenId, _commercialUse, _mediaLicensingEnabled);
    }

    /**
     * @dev Update royalty receiver for a token (only original creator)
     */
    function updateRoyaltyReceiver(uint256 _tokenId, address _newReceiver) external {
        VideoRecord memory record = videoRecords[_tokenId];
        if (record.originalCreator != msg.sender) revert Unauthorized();
        if (_newReceiver == address(0)) revert ZeroAddress();

        tokenRoyalties[_tokenId].receiver = _newReceiver;

        emit TokenRoyaltyUpdated(_tokenId, _newReceiver, tokenRoyalties[_tokenId].royaltyBps);
    }

    // ============ View Functions ============

    /**
     * @dev Verifies a video by token ID
     */
    function verify(uint256 _tokenId) external view returns (
        bytes32 sha256Hash,
        bytes32 ipfsCidHash,
        address originalCreator,
        address currentOwner,
        uint64 timestamp,
        bool exists
    ) {
        if (_ownerOf(_tokenId) == address(0)) {
            return (bytes32(0), bytes32(0), address(0), address(0), 0, false);
        }

        VideoRecord memory record = videoRecords[_tokenId];
        return (
            record.sha256Hash,
            record.ipfsCidHash,
            record.originalCreator,
            ownerOf(_tokenId),
            record.timestamp,
            true
        );
    }

    /**
     * @dev Verifies a video by its SHA-256 hash
     */
    function verifyByHash(bytes32 _sha256Hash) external view returns (
        uint256 tokenId,
        address originalCreator,
        address currentOwner,
        uint64 timestamp,
        bool exists
    ) {
        tokenId = hashToTokenId[_sha256Hash];
        if (tokenId == 0) {
            return (0, address(0), address(0), 0, false);
        }

        VideoRecord memory record = videoRecords[tokenId];
        return (tokenId, record.originalCreator, ownerOf(tokenId), record.timestamp, true);
    }

    /**
     * @dev Get original creator of a token (never changes)
     */
    function getOriginalCreator(uint256 _tokenId) external view returns (address) {
        if (_ownerOf(_tokenId) == address(0)) revert NonexistentToken();
        return videoRecords[_tokenId].originalCreator;
    }

    /**
     * @dev Get licensing terms for a token
     */
    function getLicensingTerms(uint256 _tokenId) external view returns (LicensingTerms memory) {
        if (_ownerOf(_tokenId) == address(0)) revert NonexistentToken();
        return tokenLicensing[_tokenId];
    }

    /**
     * @dev Gets the total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Checks if a hash has already been minted
     */
    function isHashMinted(bytes32 _sha256Hash) external view returns (bool) {
        return hashToTokenId[_sha256Hash] != 0;
    }

    // ============ EIP-2981 Royalty Functions ============

    /**
     * @dev Returns royalty info for a given sale
     * Returns combined creator + platform royalty
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override
        returns (address, uint256)
    {
        RoyaltyConfig memory config = tokenRoyalties[_tokenId];

        // If no specific config, use defaults
        address receiver = config.receiver != address(0) ? config.receiver : platformRoyaltyReceiver;
        uint96 royalty = config.royaltyBps > 0 ? config.royaltyBps : defaultRoyaltyBps;

        // Creator royalty (platform fee handled separately in marketplace)
        return (receiver, (_salePrice * royalty) / 10000);
    }

    /**
     * @dev Get detailed royalty breakdown
     */
    function getRoyaltyBreakdown(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (
            address creatorReceiver,
            uint256 creatorAmount,
            address platformReceiver,
            uint256 platformAmount
        )
    {
        RoyaltyConfig memory config = tokenRoyalties[_tokenId];

        creatorReceiver = config.receiver != address(0) ? config.receiver : videoRecords[_tokenId].originalCreator;
        uint96 creatorBps = config.royaltyBps > 0 ? config.royaltyBps : defaultRoyaltyBps;
        creatorAmount = (_salePrice * creatorBps) / 10000;

        platformReceiver = platformRoyaltyReceiver;
        platformAmount = (_salePrice * platformRoyaltyBps) / 10000;
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the default royalty percentage
     */
    function setDefaultRoyaltyBps(uint96 _newBps) external onlyOwner {
        if (_newBps > MAX_ROYALTY_BPS) revert RoyaltyTooHigh();
        defaultRoyaltyBps = _newBps;
        emit DefaultRoyaltyUpdated(_newBps);
    }

    /**
     * @dev Sets the platform royalty
     */
    function setPlatformRoyalty(address _receiver, uint96 _bps) external onlyOwner {
        if (_receiver == address(0)) revert ZeroAddress();
        if (_bps > MAX_ROYALTY_BPS) revert RoyaltyTooHigh();

        platformRoyaltyReceiver = _receiver;
        platformRoyaltyBps = _bps;

        emit PlatformRoyaltyUpdated(_receiver, _bps);
    }

    /**
     * @dev Sets the base URI for token metadata
     */
    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        _baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @dev Sets the marketplace contract address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        if (_marketplace == address(0)) revert ZeroAddress();
        marketplaceContract = _marketplace;
        _grantRole(MARKETPLACE_ROLE, _marketplace);
        emit MarketplaceUpdated(_marketplace);
    }

    // ============ Overrides ============

    /**
     * @dev Returns the token URI for a given token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();

        string memory baseURI = _baseTokenURI;
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
            : "";
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
