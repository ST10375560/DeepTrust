// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DeepTrustVerification
 * @dev Smart contract for DeepTrust - Anchoring AI verification results on BlockDAG
 */
contract DeepTrustVerification {
    
    // ============ Structs ============
    
    struct Verification {
        uint256 id;
        string contentHash;      // SHA-256 of the content file
        uint256 trustScore;      // 0-100 score from AI engine
        string aiMetadataHash;   // IPFS hash or similar of detailed AI analysis JSON
        uint256 timestamp;
        VerificationStatus status;
        address verifier;        // The address that submitted the verification (the oracle/server)
    }
    
    enum VerificationStatus { Verified, Suspicious, Fake }
    
    // ============ State Variables ============
    
    Verification[] public verifications;
    
    // Mapping from content hash to verification IDs (history of checks for same content)
    mapping(string => uint256[]) public contentHistory;
    
    // Access control
    address public owner;
    mapping(address => bool) public authorizedVerifiers;
    
    // ============ Events ============
    
    event VerificationAnchored(
        uint256 indexed id,
        string indexed contentHash,
        uint256 trustScore,
        VerificationStatus status,
        uint256 timestamp
    );
    
    event VerifierAuthorized(address indexed verifier);
    event VerifierRevoked(address indexed verifier);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized verifier");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true; // Owner is default verifier
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Store a new verification result on-chain
     * @param _contentHash Hash of the verified content
     * @param _trustScore 0-100 authenticity score
     * @param _aiMetadataHash Hash of the full AI analysis report
     * @return uint256 ID of the new verification record
     */
    function storeVerification(
        string memory _contentHash,
        uint256 _trustScore,
        string memory _aiMetadataHash
    ) public onlyVerifier returns (uint256) {
        require(_trustScore <= 100, "Score must be 0-100");
        
        uint256 newId = verifications.length;
        
        VerificationStatus status;
        if (_trustScore >= 80) {
            status = VerificationStatus.Verified;
        } else if (_trustScore >= 50) {
            status = VerificationStatus.Suspicious;
        } else {
            status = VerificationStatus.Fake;
        }
        
        Verification memory newVerification = Verification({
            id: newId,
            contentHash: _contentHash,
            trustScore: _trustScore,
            aiMetadataHash: _aiMetadataHash,
            timestamp: block.timestamp,
            status: status,
            verifier: msg.sender
        });
        
        verifications.push(newVerification);
        contentHistory[_contentHash].push(newId);
        
        emit VerificationAnchored(newId, _contentHash, _trustScore, status, block.timestamp);
        
        return newId;
    }
    
    // ============ Admin Functions ============
    
    function addVerifier(address _verifier) public onlyOwner {
        authorizedVerifiers[_verifier] = true;
        emit VerifierAuthorized(_verifier);
    }
    
    function removeVerifier(address _verifier) public onlyOwner {
        authorizedVerifiers[_verifier] = false;
        emit VerifierRevoked(_verifier);
    }
    
    // ============ View Functions ============
    
    function getVerification(uint256 _id) public view returns (Verification memory) {
        require(_id < verifications.length, "Verification does not exist");
        return verifications[_id];
    }
    
    function getVerificationCount() public view returns (uint256) {
        return verifications.length;
    }
    
    function getContentHistory(string memory _contentHash) public view returns (uint256[] memory) {
        return contentHistory[_contentHash];
    }
    
    function getLatestVerification(string memory _contentHash) public view returns (Verification memory) {
        uint256[] memory history = contentHistory[_contentHash];
        require(history.length > 0, "No history for this content");
        return verifications[history[history.length - 1]];
    }
}

