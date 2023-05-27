const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CrowdfundingProject', function () {
  let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

  beforeEach(async () => {
    CrowdfundingProject = await ethers.getContractFactory(
      'CrowdfundingProject'
    );
    [owner, addr1, addr2, _] = await ethers.getSigners();
    crowdfundingProject = await CrowdfundingProject.deploy();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await crowdfundingProject.owner()).to.equal(owner.address);
    });

    it('Should set the platform fee to default', async function () {
      expect(await crowdfundingProject.fee()).to.equal(5);
    });
  });

  describe('Creating a project', function () {
    it('Should create a project successfully', async function () {
      await crowdfundingProject.createProject(
        'Test Project',
        'Test Description',
        ethers.utils.parseEther('10'),
        Math.floor(Date.now() / 1000) + 600,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
      );
      const project = await crowdfundingProject.projects(0);
      expect(project.name).to.equal('Test Project');
    });

    // Add more tests for different scenarios...
  });

  // Add more tests for contributing to a project, withdrawing funds, claiming rewards, etc...
});
