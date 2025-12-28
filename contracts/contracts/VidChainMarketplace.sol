// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VidChainMarketplace
 * @dev NFT Marketplace for VidChain video NFTs
 * @notice Supports fixed price listings, auctions, and offers
 *
 * Features:
 * - Fixed price listings with instant buy
 * - Timed auctions with reserve prices
 * - Offer system with escrow
 * - Multi-currency support (VIDC, ETH, MATIC)
 * - Automatic royalty distribution (EIP-2981)
 * - Platform fee collection
 */
contract VidChainMarketplace is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Roles ============

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============ Enums ============

    enum ListingType { FixedPrice, Auction }
    enum ListingStatus { Active, Sold, Cancelled }
    enum OfferStatus { Active, Accepted, Rejected, Cancelled, Expired }

    // ============ Structs ============

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        ListingType listingType;
        ListingStatus status;
        address paymentToken;       // address(0) for native currency
        uint256 price;              // Fixed price or starting price
        uint256 reservePrice;       // For auctions (0 = no reserve)
        uint256 startTime;
        uint256 endTime;            // 0 for fixed price (no expiry)
        bool acceptsOffers;         // Allow offers on fixed price
    }

    struct Auction {
        uint256 highestBid;
        address highestBidder;
        uint256 bidCount;
        uint256 minBidIncrement;    // Minimum increment (basis points)
    }

    struct Offer {
        uint256 offerId;
        address buyer;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 amount;
        uint256 expiresAt;
        OfferStatus status;
    }

    // ============ State Variables ============

    /// @dev Listing ID counter
    uint256 public nextListingId;

    /// @dev Offer ID counter
    uint256 public nextOfferId;

    /// @dev Platform fee in basis points (250 = 2.5%)
    uint256 public platformFeeBps;

    /// @dev Maximum platform fee (5%)
    uint256 public constant MAX_PLATFORM_FEE = 500;

    /// @dev Minimum auction duration (1 hour)
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;

    /// @dev Maximum auction duration (30 days)
    uint256 public constant MAX_AUCTION_DURATION = 30 days;

    /// @dev Default minimum bid increment (5%)
    uint256 public constant DEFAULT_MIN_BID_INCREMENT = 500;

    /// @dev Fee recipient address
    address public feeRecipient;

    /// @dev VIDC token address
    address public vidcToken;

    /// @dev Allowed NFT contracts
    mapping(address => bool) public allowedNFTContracts;

    /// @dev Allowed payment tokens
    mapping(address => bool) public allowedPaymentTokens;

    /// @dev Listings by ID
    mapping(uint256 => Listing) public listings;

    /// @dev Auction data by listing ID
    mapping(uint256 => Auction) public auctions;

    /// @dev Token listing lookup: nftContract => tokenId => listingId
    mapping(address => mapping(uint256 => uint256)) public tokenListingId;

    /// @dev Offers by ID
    mapping(uint256 => Offer) public offers;

    /// @dev Offers per token: nftContract => tokenId => offerIds[]
    mapping(address => mapping(uint256 => uint256[])) public tokenOffers;

    /// @dev User active listings
    mapping(address => uint256[]) public userListings;

    /// @dev User active offers
    mapping(address => uint256[]) public userOffers;

    // ============ Events ============

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        ListingType listingType,
        address paymentToken,
        uint256 price
    );

    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event ListingCancelled(uint256 indexed listingId);

    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyFee
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event BidRefunded(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        uint256 indexed listingId,
        address indexed winner,
        uint256 finalPrice
    );

    event OfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event OfferAccepted(uint256 indexed offerId, address indexed seller);
    event OfferRejected(uint256 indexed offerId);
    event OfferCancelled(uint256 indexed offerId);
    event OfferExpired(uint256 indexed offerId);

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event NFTContractUpdated(address nftContract, bool allowed);
    event PaymentTokenUpdated(address token, bool allowed);

    // ============ Errors ============

    error InvalidNFTContract();
    error InvalidPaymentToken();
    error NotTokenOwner();
    error NotApproved();
    error ListingNotActive();
    error ListingExpired();
    error AuctionNotEnded();
    error AuctionEnded();
    error BidTooLow();
    error ReservePriceNotMet();
    error InvalidDuration();
    error InvalidPrice();
    error OfferNotActive();
    error OfferExpiredError();
    error NotOfferBuyer();
    error NotListingSeller();
    error CannotBidOnOwnListing();
    error TransferFailed();
    error ZeroAddress();

    // ============ Constructor ============

    constructor(address _feeRecipient, address _vidcToken) {
        if (_feeRecipient == address(0)) revert ZeroAddress();

        feeRecipient = _feeRecipient;
        vidcToken = _vidcToken;
        platformFeeBps = 250; // 2.5% default

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Allow native currency payments
        allowedPaymentTokens[address(0)] = true;

        // Allow VIDC if set
        if (_vidcToken != address(0)) {
            allowedPaymentTokens[_vidcToken] = true;
        }
    }

    // ============ Listing Functions ============

    /**
     * @dev Create a fixed price listing
     * @param _nftContract NFT contract address
     * @param _tokenId Token ID to list
     * @param _paymentToken Payment token (address(0) for native)
     * @param _price Listing price
     * @param _acceptsOffers Allow offers on this listing
     */
    function createFixedPriceListing(
        address _nftContract,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _price,
        bool _acceptsOffers
    ) external nonReentrant whenNotPaused returns (uint256) {
        _validateListing(_nftContract, _tokenId, _paymentToken, _price);

        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            listingType: ListingType.FixedPrice,
            status: ListingStatus.Active,
            paymentToken: _paymentToken,
            price: _price,
            reservePrice: 0,
            startTime: block.timestamp,
            endTime: 0,
            acceptsOffers: _acceptsOffers
        });

        tokenListingId[_nftContract][_tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        // Transfer NFT to marketplace
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            ListingType.FixedPrice,
            _paymentToken,
            _price
        );

        return listingId;
    }

    /**
     * @dev Create an auction listing
     * @param _nftContract NFT contract address
     * @param _tokenId Token ID to auction
     * @param _paymentToken Payment token
     * @param _startingPrice Starting bid price
     * @param _reservePrice Reserve price (0 for no reserve)
     * @param _duration Auction duration in seconds
     */
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        _validateListing(_nftContract, _tokenId, _paymentToken, _startingPrice);

        if (_duration < MIN_AUCTION_DURATION || _duration > MAX_AUCTION_DURATION) {
            revert InvalidDuration();
        }

        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            listingType: ListingType.Auction,
            status: ListingStatus.Active,
            paymentToken: _paymentToken,
            price: _startingPrice,
            reservePrice: _reservePrice,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            acceptsOffers: false
        });

        auctions[listingId] = Auction({
            highestBid: 0,
            highestBidder: address(0),
            bidCount: 0,
            minBidIncrement: DEFAULT_MIN_BID_INCREMENT
        });

        tokenListingId[_nftContract][_tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        // Transfer NFT to marketplace
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            ListingType.Auction,
            _paymentToken,
            _startingPrice
        );

        return listingId;
    }

    /**
     * @dev Update listing price (fixed price only)
     */
    function updateListingPrice(uint256 _listingId, uint256 _newPrice) external nonReentrant {
        Listing storage listing = listings[_listingId];

        if (listing.seller != msg.sender) revert NotListingSeller();
        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (listing.listingType != ListingType.FixedPrice) revert InvalidPrice();
        if (_newPrice == 0) revert InvalidPrice();

        listing.price = _newPrice;

        emit ListingUpdated(_listingId, _newPrice);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];

        if (listing.seller != msg.sender) revert NotListingSeller();
        if (listing.status != ListingStatus.Active) revert ListingNotActive();

        // For auctions, can only cancel if no bids
        if (listing.listingType == ListingType.Auction) {
            if (auctions[_listingId].bidCount > 0) revert InvalidPrice();
        }

        listing.status = ListingStatus.Cancelled;
        delete tokenListingId[listing.nftContract][listing.tokenId];

        // Return NFT to seller
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(_listingId);
    }

    // ============ Purchase Functions ============

    /**
     * @dev Buy a fixed price listing
     */
    function buy(uint256 _listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];

        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (listing.listingType != ListingType.FixedPrice) revert InvalidPrice();

        _executeSale(_listingId, msg.sender, listing.price);
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 _listingId, uint256 _bidAmount) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        Auction storage auction = auctions[_listingId];

        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (listing.listingType != ListingType.Auction) revert InvalidPrice();
        if (block.timestamp >= listing.endTime) revert AuctionEnded();
        if (listing.seller == msg.sender) revert CannotBidOnOwnListing();

        uint256 bidAmount = listing.paymentToken == address(0) ? msg.value : _bidAmount;

        // Check minimum bid
        uint256 minBid = auction.highestBid == 0
            ? listing.price
            : auction.highestBid + ((auction.highestBid * auction.minBidIncrement) / 10000);

        if (bidAmount < minBid) revert BidTooLow();

        // Handle payment
        if (listing.paymentToken == address(0)) {
            if (msg.value < bidAmount) revert BidTooLow();
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(msg.sender, address(this), bidAmount);
        }

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            _refundBid(listing.paymentToken, auction.highestBidder, auction.highestBid);
            emit BidRefunded(_listingId, auction.highestBidder, auction.highestBid);
        }

        // Update auction state
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;
        auction.bidCount++;

        emit BidPlaced(_listingId, msg.sender, bidAmount);
    }

    /**
     * @dev Settle an ended auction
     */
    function settleAuction(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        Auction storage auction = auctions[_listingId];

        if (listing.status != ListingStatus.Active) revert ListingNotActive();
        if (listing.listingType != ListingType.Auction) revert InvalidPrice();
        if (block.timestamp < listing.endTime) revert AuctionNotEnded();

        // Check if reserve met
        if (auction.highestBid < listing.reservePrice) {
            // Reserve not met, return NFT to seller
            listing.status = ListingStatus.Cancelled;

            if (auction.highestBidder != address(0)) {
                _refundBid(listing.paymentToken, auction.highestBidder, auction.highestBid);
            }

            IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);

            emit AuctionSettled(_listingId, address(0), 0);
            return;
        }

        if (auction.highestBidder == address(0)) {
            // No bids, cancel auction
            listing.status = ListingStatus.Cancelled;
            IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);
            emit AuctionSettled(_listingId, address(0), 0);
            return;
        }

        // Execute sale to highest bidder
        _executeAuctionSale(_listingId);
    }

    // ============ Offer Functions ============

    /**
     * @dev Create an offer for an NFT
     * @param _nftContract NFT contract address
     * @param _tokenId Token ID
     * @param _paymentToken Payment token
     * @param _amount Offer amount
     * @param _duration Offer duration in seconds
     */
    function createOffer(
        address _nftContract,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _amount,
        uint256 _duration
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        if (!allowedNFTContracts[_nftContract]) revert InvalidNFTContract();
        if (!allowedPaymentTokens[_paymentToken]) revert InvalidPaymentToken();
        if (_amount == 0) revert InvalidPrice();

        uint256 offerId = nextOfferId++;

        // Escrow payment
        if (_paymentToken == address(0)) {
            if (msg.value < _amount) revert InvalidPrice();
        } else {
            IERC20(_paymentToken).safeTransferFrom(msg.sender, address(this), _amount);
        }

        offers[offerId] = Offer({
            offerId: offerId,
            buyer: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            paymentToken: _paymentToken,
            amount: _amount,
            expiresAt: block.timestamp + _duration,
            status: OfferStatus.Active
        });

        tokenOffers[_nftContract][_tokenId].push(offerId);
        userOffers[msg.sender].push(offerId);

        emit OfferCreated(offerId, msg.sender, _nftContract, _tokenId, _amount);

        return offerId;
    }

    /**
     * @dev Accept an offer (by NFT owner or listing seller)
     */
    function acceptOffer(uint256 _offerId) external nonReentrant whenNotPaused {
        Offer storage offer = offers[_offerId];

        if (offer.status != OfferStatus.Active) revert OfferNotActive();
        if (block.timestamp >= offer.expiresAt) revert OfferExpiredError();

        // Check if caller owns the NFT or is listing seller
        address nftOwner = IERC721(offer.nftContract).ownerOf(offer.tokenId);
        uint256 listingId = tokenListingId[offer.nftContract][offer.tokenId];

        bool isOwner = nftOwner == msg.sender;
        bool isListingSeller = listingId > 0 &&
            listings[listingId].status == ListingStatus.Active &&
            listings[listingId].seller == msg.sender &&
            listings[listingId].acceptsOffers;

        if (!isOwner && !isListingSeller) revert NotListingSeller();

        offer.status = OfferStatus.Accepted;

        // If there's an active listing, cancel it
        if (listingId > 0 && listings[listingId].status == ListingStatus.Active) {
            listings[listingId].status = ListingStatus.Sold;
            delete tokenListingId[offer.nftContract][offer.tokenId];

            // NFT already in marketplace
            _executeOfferSale(offer, msg.sender, true);
        } else {
            // Transfer NFT from owner
            IERC721(offer.nftContract).transferFrom(msg.sender, address(this), offer.tokenId);
            _executeOfferSale(offer, msg.sender, false);
        }

        emit OfferAccepted(_offerId, msg.sender);
    }

    /**
     * @dev Reject an offer (by NFT owner)
     */
    function rejectOffer(uint256 _offerId) external nonReentrant {
        Offer storage offer = offers[_offerId];

        if (offer.status != OfferStatus.Active) revert OfferNotActive();

        // Check if caller owns the NFT
        address nftOwner = IERC721(offer.nftContract).ownerOf(offer.tokenId);
        if (nftOwner != msg.sender) revert NotListingSeller();

        offer.status = OfferStatus.Rejected;

        // Refund buyer
        _refundBid(offer.paymentToken, offer.buyer, offer.amount);

        emit OfferRejected(_offerId);
    }

    /**
     * @dev Cancel an offer (by buyer)
     */
    function cancelOffer(uint256 _offerId) external nonReentrant {
        Offer storage offer = offers[_offerId];

        if (offer.status != OfferStatus.Active) revert OfferNotActive();
        if (offer.buyer != msg.sender) revert NotOfferBuyer();

        offer.status = OfferStatus.Cancelled;

        // Refund buyer
        _refundBid(offer.paymentToken, offer.buyer, offer.amount);

        emit OfferCancelled(_offerId);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newFeeBps <= MAX_PLATFORM_FEE, "Fee too high");

        uint256 oldFee = platformFeeBps;
        platformFeeBps = _newFeeBps;

        emit PlatformFeeUpdated(oldFee, _newFeeBps);
    }

    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newRecipient == address(0)) revert ZeroAddress();

        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;

        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @dev Add/remove allowed NFT contract
     */
    function setAllowedNFTContract(address _nftContract, bool _allowed) external onlyRole(OPERATOR_ROLE) {
        allowedNFTContracts[_nftContract] = _allowed;
        emit NFTContractUpdated(_nftContract, _allowed);
    }

    /**
     * @dev Add/remove allowed payment token
     */
    function setAllowedPaymentToken(address _token, bool _allowed) external onlyRole(OPERATOR_ROLE) {
        allowedPaymentTokens[_token] = _allowed;
        emit PaymentTokenUpdated(_token, _allowed);
    }

    /**
     * @dev Pause marketplace
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @dev Get listing details
     */
    function getListing(uint256 _listingId) external view returns (
        Listing memory listing,
        Auction memory auction
    ) {
        return (listings[_listingId], auctions[_listingId]);
    }

    /**
     * @dev Get all offers for a token
     */
    function getTokenOffers(address _nftContract, uint256 _tokenId)
        external view returns (uint256[] memory)
    {
        return tokenOffers[_nftContract][_tokenId];
    }

    /**
     * @dev Get user's listings
     */
    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }

    /**
     * @dev Get user's offers
     */
    function getUserOffers(address _user) external view returns (uint256[] memory) {
        return userOffers[_user];
    }

    // ============ Internal Functions ============

    function _validateListing(
        address _nftContract,
        uint256 _tokenId,
        address _paymentToken,
        uint256 _price
    ) internal view {
        if (!allowedNFTContracts[_nftContract]) revert InvalidNFTContract();
        if (!allowedPaymentTokens[_paymentToken]) revert InvalidPaymentToken();
        if (_price == 0) revert InvalidPrice();

        // Check ownership and approval
        if (IERC721(_nftContract).ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        if (!IERC721(_nftContract).isApprovedForAll(msg.sender, address(this)) &&
            IERC721(_nftContract).getApproved(_tokenId) != address(this)) {
            revert NotApproved();
        }
    }

    function _executeSale(uint256 _listingId, address _buyer, uint256 _price) internal {
        Listing storage listing = listings[_listingId];

        // Handle payment
        if (listing.paymentToken == address(0)) {
            if (msg.value < _price) revert InvalidPrice();
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(_buyer, address(this), _price);
        }

        // Calculate fees
        (uint256 platformFee, uint256 royaltyFee, address royaltyRecipient) =
            _calculateFees(listing.nftContract, listing.tokenId, _price);

        uint256 sellerProceeds = _price - platformFee - royaltyFee;

        // Distribute payments
        _distributePayments(
            listing.paymentToken,
            listing.seller,
            sellerProceeds,
            platformFee,
            royaltyRecipient,
            royaltyFee
        );

        // Update listing
        listing.status = ListingStatus.Sold;
        delete tokenListingId[listing.nftContract][listing.tokenId];

        // Transfer NFT
        IERC721(listing.nftContract).transferFrom(address(this), _buyer, listing.tokenId);

        emit ItemSold(_listingId, _buyer, listing.seller, _price, platformFee, royaltyFee);
    }

    function _executeAuctionSale(uint256 _listingId) internal {
        Listing storage listing = listings[_listingId];
        Auction storage auction = auctions[_listingId];

        uint256 price = auction.highestBid;
        address buyer = auction.highestBidder;

        // Calculate fees
        (uint256 platformFee, uint256 royaltyFee, address royaltyRecipient) =
            _calculateFees(listing.nftContract, listing.tokenId, price);

        uint256 sellerProceeds = price - platformFee - royaltyFee;

        // Distribute payments (funds already in contract)
        _distributePayments(
            listing.paymentToken,
            listing.seller,
            sellerProceeds,
            platformFee,
            royaltyRecipient,
            royaltyFee
        );

        // Update listing
        listing.status = ListingStatus.Sold;
        delete tokenListingId[listing.nftContract][listing.tokenId];

        // Transfer NFT
        IERC721(listing.nftContract).transferFrom(address(this), buyer, listing.tokenId);

        emit AuctionSettled(_listingId, buyer, price);
        emit ItemSold(_listingId, buyer, listing.seller, price, platformFee, royaltyFee);
    }

    function _executeOfferSale(Offer storage offer, address seller, bool nftInMarketplace) internal {
        // Calculate fees
        (uint256 platformFee, uint256 royaltyFee, address royaltyRecipient) =
            _calculateFees(offer.nftContract, offer.tokenId, offer.amount);

        uint256 sellerProceeds = offer.amount - platformFee - royaltyFee;

        // Distribute payments (funds already in contract from offer)
        _distributePayments(
            offer.paymentToken,
            seller,
            sellerProceeds,
            platformFee,
            royaltyRecipient,
            royaltyFee
        );

        // Transfer NFT
        if (nftInMarketplace) {
            IERC721(offer.nftContract).transferFrom(address(this), offer.buyer, offer.tokenId);
        } else {
            IERC721(offer.nftContract).transferFrom(address(this), offer.buyer, offer.tokenId);
        }
    }

    function _calculateFees(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) internal view returns (uint256 platformFee, uint256 royaltyFee, address royaltyRecipient) {
        platformFee = (_price * platformFeeBps) / 10000;

        // Check for EIP-2981 royalties
        if (IERC165(_nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyRecipient, royaltyFee) = IERC2981(_nftContract).royaltyInfo(_tokenId, _price);
        }

        return (platformFee, royaltyFee, royaltyRecipient);
    }

    function _distributePayments(
        address _paymentToken,
        address _seller,
        uint256 _sellerAmount,
        uint256 _platformFee,
        address _royaltyRecipient,
        uint256 _royaltyFee
    ) internal {
        if (_paymentToken == address(0)) {
            // Native currency
            (bool success1, ) = payable(_seller).call{value: _sellerAmount}("");
            if (!success1) revert TransferFailed();

            (bool success2, ) = payable(feeRecipient).call{value: _platformFee}("");
            if (!success2) revert TransferFailed();

            if (_royaltyFee > 0 && _royaltyRecipient != address(0)) {
                (bool success3, ) = payable(_royaltyRecipient).call{value: _royaltyFee}("");
                if (!success3) revert TransferFailed();
            }
        } else {
            // ERC20 token
            IERC20(_paymentToken).safeTransfer(_seller, _sellerAmount);
            IERC20(_paymentToken).safeTransfer(feeRecipient, _platformFee);

            if (_royaltyFee > 0 && _royaltyRecipient != address(0)) {
                IERC20(_paymentToken).safeTransfer(_royaltyRecipient, _royaltyFee);
            }
        }
    }

    function _refundBid(address _paymentToken, address _bidder, uint256 _amount) internal {
        if (_paymentToken == address(0)) {
            (bool success, ) = payable(_bidder).call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(_paymentToken).safeTransfer(_bidder, _amount);
        }
    }

    // ============ Receive ETH ============

    receive() external payable {}
}
