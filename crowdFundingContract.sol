import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdfundingPlatform is Ownable {
    struct Contribution {
        address contributor;
        uint256 amount;
    }

    struct Project {
        uint256 projectId;
        string name;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 minimumContribution;
        address payable owner;
        mapping(address => Contribution) contributions;
        address[] contributorList;
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

    // es necesaria esta funcion ya que no se puede inicializar un mapping en una funcion para una estructura
    function initializeProject(uint256 _projectId, string memory _name, string memory _description, uint256 _goal, uint256 _deadline, uint256 _minimumContribution, address payable _owner, string memory _currency) internal {
        Project storage project = projects[_projectId];
        project.projectId = _projectId;
        project.name = _name;
        project.description = _description;
        project.goal = _goal;
        project.deadline = _deadline;
        project.minimumContribution = _minimumContribution;
        project.owner = _owner;
        project.totalContributions = 0;
        project.currency = _currency;
        project.funded = false;
    }

    function addReward(uint256 _projectId, uint256 _index, string memory _reward) public {
        Project storage project = projects[_projectId];
        project.rewards[_index] = _reward;
    }

    function addContribution(uint256 _projectId, uint256 _amount) public payable {
        Project storage project = projects[_projectId];
        require(msg.value == _amount, "Amount should match value sent");
        require(project.deadline > block.timestamp, "Deadline has passed");
        require(_amount >= project.minimumContribution, "Amount should be greater than or equal to minimum contribution");
        project.contributions[msg.sender] = Contribution({
            contributor: msg.sender,
            amount: _amount
        });
        project.contributorList.push(msg.sender);
        project.totalContributions += _amount;
        if (project.totalContributions == project.goal) {
            project.funded = true;
            emit ProjectFunded(_projectId, project.totalContributions);
        }
        emit ContributionAdded(_projectId, msg.sender, _amount);
    }
    
    function createProject(string memory _name, string memory _description, uint256 _goal, uint256 _deadline, uint256 _minimumContribution, string memory _currency) public {
        require(_goal > 0, "Goal should be greater than zero");
        require(_deadline > block.timestamp, "Deadline should be in the future");
        require(bytes(_name).length > 0, "Name should not be empty");
        require(bytes(_currency).length > 0, "Currency should not be empty");
        projectCount++;
        initializeProject(projectCount, _name, _description, _goal, _deadline, _minimumContribution, payable(msg.sender), _currency);
        emit ProjectCreated(projectCount, _name, _goal, _deadline, _currency);
    }

    // Función para listar los proyectos
    function getProjects() public view returns (uint[] memory) {
    uint[] memory projectIds = new uint[](projectCount);
        for (uint i = 0; i < projectCount; i++) {
            projectIds[i] = i;
        }
        return projectIds;
    }

    // Función para configurar las criptomonedas aceptadas
    function setAcceptedTokens(/* Parámetros de criptomonedas aceptadas */) public onlyOwner {
        // ...
    }

    // Función para configurar el porcentaje de comisión
    function setPlatformFee( uint256  _newFee) public onlyOwner {
        require(_newFee > 0  && _newFee < 100, "Fee should be a percentage, between 0 and 100");
        fee = _newFee;
    }

    // Función para retirar las comisiones recaudadas
    function withdrawFees(/* Dirección de retiro */) public onlyOwner {
        // ...
    }
    
    function contribute(uint256 _projectId) public payable {
        require(_projectId > 0 && _projectId <= projectCount, "Invalid project ID");
        require(msg.value >= projects[_projectId].minimumContribution, "Minimum contribution not met");
        require(block.timestamp < projects[_projectId].deadline, "Deadline passed");
        projects[_projectId].contributions[msg.sender].amount += msg.value;
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
        require(projects[_projectId].contributions[msg.sender].amount > 0, "No contribution found");
        // require...
    }

}
    
pragma solidity ^0.8.0;



