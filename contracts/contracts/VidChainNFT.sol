// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VidChainNFT
 * @dev Video authenticity verification NFT contract for VidChain platform
 * @notice This contract mints NFTs that serve as immutable proof of video authenticity
 *
 * Features:
 * - ERC-721 compliant NFTs for video verification
 * - EIP-2981 royalty standard support
 * - Gas-optimized storage for video records
 * - Duplicate prevention via hash mapping
 * - On-chain verification queries
 */
contract VidChainNFT is ERC721, IERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ============ Structs ============

    /**
     * @dev Gas-optimized struct for storing video verification data
     * Uses storage packing: 32 + 32 + 8 + 4 = 76 bytes (fits in 3 slots)
     */
    struct VideoRecord {
        bytes32 sha256Hash;      // SHA-256 hash of the video content
        bytes32 ipfsCidHash;     // keccak256 hash of IPFS CID (for gas efficiency)
        uint64 timestamp;        // Verification timestamp
        uint32 version;          // Schema version for future upgrades
    }

    // ============ State Variables ============

    /// @dev Mapping from token ID to video record
    mapping(uint256 => VideoRecord) public videoRecords;

    /// @dev Mapping from SHA-256 hash to token ID (prevents duplicate mints)
    mapping(bytes32 => uint256) public hashToTokenId;

    /// @dev Counter for token IDs (starts at 1)
    uint256 private _tokenIdCounter;

    /// @dev Royalty percentage in basis points (500 = 5%)
    uint96 public royaltyBps;

    /// @dev Base URI for token metadata
    string private _baseTokenURI;

    /// @dev Maximum royalty percentage (10%)
    uint96 public constant MAX_ROYALTY_BPS = 1000;

    /// @dev Current schema version
    uint32 public constant SCHEMA_VERSION = 1;

    // ============ Events ============

    /**
     * @dev Emitted when a video is authenticated and minted
     * @param tokenId The ID of the minted NFT
     * @param sha256Hash The SHA-256 hash of the video
     * @param ipfsCid The IPFS CID where the video is stored
     * @param creator The address that created the verification
     * @param timestamp The time of verification
     */
    event VideoAuthenticated(
        uint256 indexed tokenId,
        bytes32 indexed sha256Hash,
        string ipfsCid,
        address indexed creator,
        uint64 timestamp
    );

    /**
     * @dev Emitted when royalty percentage is updated
     * @param newRoyaltyBps The new royalty in basis points
     */
    event RoyaltyUpdated(uint96 newRoyaltyBps);

    /**
     * @dev Emitted when base URI is updated
     * @param newBaseURI The new base URI
     */
    event BaseURIUpdated(string newBaseURI);

    // ============ Errors ============

    error InvalidHash();
    error InvalidCID();
    error AlreadyMinted();
    error RoyaltyTooHigh();
    error NonexistentToken();
    error ZeroAddress();

    // ============ Constructor ============

    /**
     * @dev Initializes the contract with default values
     */
    constructor() ERC721("VidChain Verified", "VIDC") Ownable(msg.sender) {
        royaltyBps = 500; // 5% default royalty
    }

    // ============ External Functions ============

    /**
     * @dev Mints a new video authentication NFT
     * @param _sha256Hash The SHA-256 hash of the video content
     * @param _ipfsCid The IPFS CID where the video is stored
     * @param _to The address to receive the NFT
     * @return tokenId The ID of the newly minted NFT
     */
    function mintAuthenticated(
        bytes32 _sha256Hash,
        string calldata _ipfsCid,
        address _to
    ) external nonReentrant returns (uint256) {
        // Validate inputs
        if (_sha256Hash == bytes32(0)) revert InvalidHash();
        if (bytes(_ipfsCid).length == 0) revert InvalidCID();
        if (_to == address(0)) revert ZeroAddress();
        if (hashToTokenId[_sha256Hash] != 0) revert AlreadyMinted();

        // Increment counter and mint
        uint256 tokenId = ++_tokenIdCounter;

        // Store video record
        videoRecords[tokenId] = VideoRecord({
            sha256Hash: _sha256Hash,
            ipfsCidHash: keccak256(bytes(_ipfsCid)),
            timestamp: uint64(block.timestamp),
            version: SCHEMA_VERSION
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
     * @param _sha256Hashes Array of SHA-256 hashes
     * @param _ipfsCids Array of IPFS CIDs
     * @param _to The address to receive all NFTs
     * @return tokenIds Array of minted token IDs
     */
    function batchMintAuthenticated(
        bytes32[] calldata _sha256Hashes,
        string[] calldata _ipfsCids,
        address _to
    ) external nonReentrant returns (uint256[] memory) {
        require(_sha256Hashes.length == _ipfsCids.length, "Array length mismatch");
        require(_sha256Hashes.length <= 50, "Max 50 per batch");

        uint256[] memory tokenIds = new uint256[](_sha256Hashes.length);

        for (uint256 i = 0; i < _sha256Hashes.length; i++) {
            if (_sha256Hashes[i] == bytes32(0)) revert InvalidHash();
            if (bytes(_ipfsCids[i]).length == 0) revert InvalidCID();
            if (hashToTokenId[_sha256Hashes[i]] != 0) revert AlreadyMinted();

            uint256 tokenId = ++_tokenIdCounter;

            videoRecords[tokenId] = VideoRecord({
                sha256Hash: _sha256Hashes[i],
                ipfsCidHash: keccak256(bytes(_ipfsCids[i])),
                timestamp: uint64(block.timestamp),
                version: SCHEMA_VERSION
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

    // ============ View Functions ============

    /**
     * @dev Verifies a video by token ID
     * @param _tokenId The token ID to verify
     * @return sha256Hash The SHA-256 hash of the video
     * @return ipfsCidHash The keccak256 hash of the IPFS CID
     * @return timestamp The verification timestamp
     * @return owner The current owner of the NFT
     * @return exists Whether the token exists
     */
    function verify(uint256 _tokenId) external view returns (
        bytes32 sha256Hash,
        bytes32 ipfsCidHash,
        uint64 timestamp,
        address owner,
        bool exists
    ) {
        if (_ownerOf(_tokenId) == address(0)) {
            return (bytes32(0), bytes32(0), 0, address(0), false);
        }

        VideoRecord memory record = videoRecords[_tokenId];
        return (
            record.sha256Hash,
            record.ipfsCidHash,
            record.timestamp,
            ownerOf(_tokenId),
            true
        );
    }

    /**
     * @dev Verifies a video by its SHA-256 hash
     * @param _sha256Hash The SHA-256 hash to look up
     * @return tokenId The associated token ID (0 if not found)
     * @return timestamp The verification timestamp
     * @return owner The current owner of the NFT
     * @return exists Whether a verification exists for this hash
     */
    function verifyByHash(bytes32 _sha256Hash) external view returns (
        uint256 tokenId,
        uint64 timestamp,
        address owner,
        bool exists
    ) {
        tokenId = hashToTokenId[_sha256Hash];
        if (tokenId == 0) {
            return (0, 0, address(0), false);
        }

        VideoRecord memory record = videoRecords[tokenId];
        return (tokenId, record.timestamp, ownerOf(tokenId), true);
    }

    /**
     * @dev Gets the total number of minted tokens
     * @return The total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Checks if a hash has already been minted
     * @param _sha256Hash The hash to check
     * @return True if the hash has been minted
     */
    function isHashMinted(bytes32 _sha256Hash) external view returns (bool) {
        return hashToTokenId[_sha256Hash] != 0;
    }

    // ============ EIP-2981 Royalty Functions ============

    /**
     * @dev Returns royalty info for a given sale
     * @param _salePrice The sale price of the NFT
     * @return receiver The royalty receiver address
     * @return royaltyAmount The royalty amount
     */
    function royaltyInfo(uint256, uint256 _salePrice)
        external
        view
        override
        returns (address, uint256)
    {
        return (owner(), (_salePrice * royaltyBps) / 10000);
    }

    /**
     * @dev Sets the royalty percentage
     * @param _newBps The new royalty in basis points
     */
    function setRoyaltyBps(uint96 _newBps) external onlyOwner {
        if (_newBps > MAX_ROYALTY_BPS) revert RoyaltyTooHigh();
        royaltyBps = _newBps;
        emit RoyaltyUpdated(_newBps);
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the base URI for token metadata
     * @param _newBaseURI The new base URI
     */
    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        _baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    // ============ Overrides ============

    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId The token ID
     * @return The token URI
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
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
