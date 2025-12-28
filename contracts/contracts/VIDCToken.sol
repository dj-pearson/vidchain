// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VIDCToken
 * @dev VidChain Platform Coin (VIDC) - The utility token for platform operations
 * @notice Used for video uploads, premium features, royalty payments, and rewards
 *
 * Features:
 * - Dynamic supply with mint and burn mechanics
 * - Role-based minting for platform operations
 * - 50% of upload fees burned for deflationary pressure
 * - Daily emission for ownership rewards
 * - Integrates with marketplace and staking contracts
 */
contract VIDCToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, ReentrancyGuard {
    // ============ Roles ============

    /// @dev Role for minting rewards (granted to platform contracts)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Role for platform operations (upload fees, marketplace)
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    /// @dev Role for managing emission parameters
    bytes32 public constant EMISSION_MANAGER_ROLE = keccak256("EMISSION_MANAGER_ROLE");

    // ============ Constants ============

    /// @dev Initial supply: 10 million VIDC
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18;

    /// @dev Maximum daily emission: 50,000 VIDC per day
    uint256 public constant MAX_DAILY_EMISSION = 50_000 * 10**18;

    /// @dev Upload cost: 1 VIDC per 10 MB (scaled by 10^18)
    uint256 public constant UPLOAD_COST_PER_10MB = 1 * 10**18;

    /// @dev Burn percentage on upload fees (50% = 5000 basis points)
    uint256 public constant UPLOAD_BURN_BPS = 5000;

    /// @dev Burn percentage on marketplace fees (25% = 2500 basis points)
    uint256 public constant MARKETPLACE_BURN_BPS = 2500;

    // ============ State Variables ============

    /// @dev Current daily emission rate for rewards
    uint256 public dailyEmissionRate;

    /// @dev Rewards distributed today
    uint256 public todayEmissions;

    /// @dev Last emission day (for resetting daily counter)
    uint256 public lastEmissionDay;

    /// @dev Total tokens ever minted (excluding initial supply)
    uint256 public totalMinted;

    /// @dev Total tokens ever burned
    uint256 public totalBurned;

    /// @dev Total upload fees collected
    uint256 public totalUploadFees;

    /// @dev Treasury address for platform fees
    address public treasury;

    /// @dev Staking contract address (for reward distribution)
    address public stakingContract;

    /// @dev Marketplace contract address
    address public marketplaceContract;

    // ============ Reward Tracking ============

    /// @dev User reward balances (claimable)
    mapping(address => uint256) public pendingRewards;

    /// @dev User total earned rewards
    mapping(address => uint256) public totalEarnedRewards;

    /// @dev Video ownership rewards (tokenId => daily reward rate)
    mapping(uint256 => uint256) public videoRewardRate;

    // ============ Events ============

    event UploadFeePaid(address indexed user, uint256 fileSize, uint256 feePaid, uint256 burned);
    event RewardMinted(address indexed recipient, uint256 amount, string reason);
    event RewardClaimed(address indexed user, uint256 amount);
    event MarketplaceFeeProcessed(uint256 totalFee, uint256 burned, uint256 toTreasury);
    event DailyEmissionRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event ContractAddressUpdated(string contractType, address newAddress);

    // ============ Errors ============

    error ExceedsDailyEmission();
    error ZeroAddress();
    error InvalidAmount();
    error InsufficientBalance();
    error UnauthorizedContract();
    error NoRewardsToClaim();

    // ============ Constructor ============

    /**
     * @dev Initializes VIDC with initial supply to treasury
     * @param _treasury Address to receive initial treasury tokens
     */
    constructor(address _treasury)
        ERC20("VidChain Platform Coin", "VIDC")
        ERC20Permit("VidChain Platform Coin")
    {
        if (_treasury == address(0)) revert ZeroAddress();

        treasury = _treasury;
        dailyEmissionRate = 25_000 * 10**18; // Start at 25,000 VIDC per day
        lastEmissionDay = block.timestamp / 1 days;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, msg.sender);
        _grantRole(EMISSION_MANAGER_ROLE, msg.sender);

        // Mint initial supply to treasury
        _mint(_treasury, INITIAL_SUPPLY);
    }

    // ============ Platform Functions ============

    /**
     * @dev Process video upload fee payment
     * @param _user User paying the fee
     * @param _fileSizeMB File size in megabytes
     * @return feePaid Total fee paid
     */
    function payUploadFee(address _user, uint256 _fileSizeMB)
        external
        nonReentrant
        onlyRole(PLATFORM_ROLE)
        returns (uint256 feePaid)
    {
        if (_user == address(0)) revert ZeroAddress();
        if (_fileSizeMB == 0) revert InvalidAmount();

        // Calculate fee: 1 VIDC per 10 MB (rounded up)
        feePaid = (((_fileSizeMB + 9) / 10) * UPLOAD_COST_PER_10MB);

        if (balanceOf(_user) < feePaid) revert InsufficientBalance();

        // Calculate burn amount (50%)
        uint256 burnAmount = (feePaid * UPLOAD_BURN_BPS) / 10000;
        uint256 treasuryAmount = feePaid - burnAmount;

        // Transfer fee
        _transfer(_user, treasury, treasuryAmount);

        // Burn portion
        _burn(_user, burnAmount);
        totalBurned += burnAmount;

        // Update stats
        totalUploadFees += feePaid;

        emit UploadFeePaid(_user, _fileSizeMB, feePaid, burnAmount);

        return feePaid;
    }

    /**
     * @dev Process marketplace fee with partial burn
     * @param _from Address paying the fee
     * @param _amount Total fee amount
     */
    function processMarketplaceFee(address _from, uint256 _amount)
        external
        nonReentrant
        onlyRole(PLATFORM_ROLE)
    {
        if (_from == address(0)) revert ZeroAddress();
        if (_amount == 0) revert InvalidAmount();
        if (balanceOf(_from) < _amount) revert InsufficientBalance();

        // Calculate burn amount (25%)
        uint256 burnAmount = (_amount * MARKETPLACE_BURN_BPS) / 10000;
        uint256 treasuryAmount = _amount - burnAmount;

        // Transfer to treasury
        _transfer(_from, treasury, treasuryAmount);

        // Burn portion
        _burn(_from, burnAmount);
        totalBurned += burnAmount;

        emit MarketplaceFeeProcessed(_amount, burnAmount, treasuryAmount);
    }

    // ============ Reward Functions ============

    /**
     * @dev Mint reward tokens to a user
     * @param _to Recipient address
     * @param _amount Amount of VIDC to mint
     * @param _reason Reason for the reward
     */
    function mintReward(
        address _to,
        uint256 _amount,
        string calldata _reason
    ) external nonReentrant onlyRole(MINTER_ROLE) {
        if (_to == address(0)) revert ZeroAddress();
        if (_amount == 0) revert InvalidAmount();

        // Check and reset daily emission counter
        _checkDailyReset();

        // Check daily emission limit
        if (todayEmissions + _amount > dailyEmissionRate) revert ExceedsDailyEmission();

        // Update counters
        todayEmissions += _amount;
        totalMinted += _amount;
        totalEarnedRewards[_to] += _amount;

        // Mint tokens
        _mint(_to, _amount);

        emit RewardMinted(_to, _amount, _reason);
    }

    /**
     * @dev Add pending rewards for user (claimable later)
     * @param _user User to reward
     * @param _amount Amount to add to pending
     */
    function addPendingReward(address _user, uint256 _amount)
        external
        onlyRole(MINTER_ROLE)
    {
        if (_user == address(0)) revert ZeroAddress();
        if (_amount == 0) revert InvalidAmount();

        pendingRewards[_user] += _amount;
    }

    /**
     * @dev Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = pendingRewards[msg.sender];
        if (rewards == 0) revert NoRewardsToClaim();

        // Check daily limit
        _checkDailyReset();
        if (todayEmissions + rewards > dailyEmissionRate) revert ExceedsDailyEmission();

        // Clear pending
        pendingRewards[msg.sender] = 0;

        // Update counters
        todayEmissions += rewards;
        totalMinted += rewards;
        totalEarnedRewards[msg.sender] += rewards;

        // Mint rewards
        _mint(msg.sender, rewards);

        emit RewardClaimed(msg.sender, rewards);
    }

    /**
     * @dev Batch distribute rewards to multiple users
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts
     * @param _reason Shared reason for all rewards
     */
    function batchMintRewards(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _reason
    ) external nonReentrant onlyRole(MINTER_ROLE) {
        require(_recipients.length == _amounts.length, "Array length mismatch");
        require(_recipients.length <= 100, "Max 100 per batch");

        _checkDailyReset();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        if (todayEmissions + totalAmount > dailyEmissionRate) revert ExceedsDailyEmission();

        todayEmissions += totalAmount;
        totalMinted += totalAmount;

        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_recipients[i] == address(0)) revert ZeroAddress();
            if (_amounts[i] == 0) continue;

            totalEarnedRewards[_recipients[i]] += _amounts[i];
            _mint(_recipients[i], _amounts[i]);

            emit RewardMinted(_recipients[i], _amounts[i], _reason);
        }
    }

    // ============ Admin Functions ============

    /**
     * @dev Updates the daily emission rate
     * @param _newRate New daily emission rate
     */
    function setDailyEmissionRate(uint256 _newRate) external onlyRole(EMISSION_MANAGER_ROLE) {
        require(_newRate <= MAX_DAILY_EMISSION, "Exceeds max daily emission");

        uint256 oldRate = dailyEmissionRate;
        dailyEmissionRate = _newRate;

        emit DailyEmissionRateUpdated(oldRate, _newRate);
    }

    /**
     * @dev Updates the treasury address
     * @param _newTreasury New treasury address
     */
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newTreasury == address(0)) revert ZeroAddress();

        address oldTreasury = treasury;
        treasury = _newTreasury;

        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Set staking contract address
     */
    function setStakingContract(address _staking) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_staking == address(0)) revert ZeroAddress();
        stakingContract = _staking;
        _grantRole(MINTER_ROLE, _staking);
        emit ContractAddressUpdated("staking", _staking);
    }

    /**
     * @dev Set marketplace contract address
     */
    function setMarketplaceContract(address _marketplace) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_marketplace == address(0)) revert ZeroAddress();
        marketplaceContract = _marketplace;
        _grantRole(PLATFORM_ROLE, _marketplace);
        emit ContractAddressUpdated("marketplace", _marketplace);
    }

    // ============ View Functions ============

    /**
     * @dev Returns remaining emission capacity for today
     */
    function remainingDailyEmission() external view returns (uint256) {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastEmissionDay) {
            return dailyEmissionRate;
        }
        return dailyEmissionRate > todayEmissions ? dailyEmissionRate - todayEmissions : 0;
    }

    /**
     * @dev Returns net supply change (minted - burned)
     */
    function netSupplyChange() external view returns (int256) {
        return int256(totalMinted) - int256(totalBurned);
    }

    /**
     * @dev Calculate upload fee for a given file size
     * @param _fileSizeMB File size in megabytes
     * @return Fee amount in VIDC
     */
    function calculateUploadFee(uint256 _fileSizeMB) external pure returns (uint256) {
        return (((_fileSizeMB + 9) / 10) * UPLOAD_COST_PER_10MB);
    }

    /**
     * @dev Get user's platform statistics
     */
    function getUserStats(address _user) external view returns (
        uint256 balance,
        uint256 pending,
        uint256 totalEarned
    ) {
        return (
            balanceOf(_user),
            pendingRewards[_user],
            totalEarnedRewards[_user]
        );
    }

    /**
     * @dev Get platform token statistics
     */
    function getTokenStats() external view returns (
        uint256 currentSupply,
        uint256 minted,
        uint256 burned,
        uint256 uploadFees,
        uint256 dailyRemaining
    ) {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 remaining = currentDay > lastEmissionDay
            ? dailyEmissionRate
            : (dailyEmissionRate > todayEmissions ? dailyEmissionRate - todayEmissions : 0);

        return (
            totalSupply(),
            totalMinted,
            totalBurned,
            totalUploadFees,
            remaining
        );
    }

    // ============ Internal Functions ============

    /**
     * @dev Check and reset daily emission counter
     */
    function _checkDailyReset() internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastEmissionDay) {
            todayEmissions = 0;
            lastEmissionDay = currentDay;
        }
    }
}
