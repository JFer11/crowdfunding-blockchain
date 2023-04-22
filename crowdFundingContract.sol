pragma solidity ^0.8.0;

contract CrowdfundingPlatform {
    struct Project {
        string name;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 minimumContribution;
        address payable owner;
        mapping(address => uint256) contributions;
        uint256 totalContributions;
        mapping(address => bool) claimed;
        string currency;
        mapping(uint256 => string) rewards;
        bool funded;
    }
    
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;
    address payable public admin;
    uint256 public fee;
    
    event ProjectCreated(uint256 projectId, string name, uint256 goal, uint256 deadline, string currency);
    event ProjectFunded(uint256 projectId, uint256 totalContributions);
    event ContributionAdded(uint256 projectId, address contributor, uint256 amount);
    event RewardClaimed(uint256 projectId, address recipient, string reward);
    event ProjectCancelled(uint256 projectId);
    event AdminFeeWithdrawn(uint256 amount);
    
    constructor() {
        admin = payable(msg.sender);
        fee = 5; // 5% fee by default
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    function createProject(string memory _name, string memory _description, uint256 _goal, uint256 _deadline, uint256 _minimumContribution, string memory _currency) public {
        require(_goal > 0, "Goal should be greater than zero");
        require(_deadline > block.timestamp, "Deadline should be in the future");
        require(bytes(_name).length > 0, "Name should not be empty");
        require(bytes(_currency).length > 0, "Currency should not be empty");
        projectCount++;
        projects[projectCount] = Project({
            name: _name,
            description: _description,
            goal: _goal,
            deadline: _deadline,
            minimumContribution: _minimumContribution,
            owner: payable(msg.sender),
            totalContributions: 0,
            currency: _currency,
            funded: false
        });
        emit ProjectCreated(projectCount, _name, _goal, _deadline, _currency);
    }
    
    function contribute(uint256 _projectId) public payable {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(msg.value >= projects[_projectId].minimumContribution, "Minimum contribution not met");
        require(block.timestamp < projects[_projectId].deadline, "Deadline passed");
        projects[_projectId].contributions[msg.sender] += msg.value;
        projects[_projectId].totalContributions += msg.value;
        emit ContributionAdded(_projectId, msg.sender, msg.value);
        if (projects[_projectId].totalContributions >= projects[_projectId].goal && !projects[_projectId].funded) {
            projects[_projectId].funded = true;
            projects[_projectId].owner.transfer(projects[_projectId].totalContributions);
            emit ProjectFunded(_projectId, projects[_projectId].totalContributions);
        }
    }
    
    function claimReward(uint256 _projectId, uint256 _rewardIndex) public {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(block.timestamp >= projects[_projectId].deadline, "Deadline not passed");
        require(projects[_projectId].contributions[msg.sender] > 0, "No contribution found");
        require...


