const { expect } = require('chai');
const { ethers } = require('hardhat');

const ONE_DAY = 86400;

describe('CrowdfundingProject', function () {
  let CrowdfundingProject, crowdfundingProject, owner, addr1, addr2;

  before(async () => {
    CrowdfundingProject = await ethers.getContractFactory(
      'CrowdfundingProject'
    );
    [owner, addr1, addr2, _] = await ethers.getSigners();
    crowdfundingProject = await CrowdfundingProject.deploy();
  });

  // Una basura esto de usar siempre el mismo contrato y mismo contexto en todos los tests. 
  // Modificamos 32 veces el tiempo, es imposible tener un entendimiento de que tiempo tiene
  // le EVM en los ultimos tests. Entre otras desventajas. Los utlimos tests, dan errores de fechas.
  // Fijate a ver si entendes porque da 'Deadline passed' una contribucion, si le estoy poniendo deadline
  // el 100 dias despues el goal.

  // beforeEach(async function () {
  //   // Get the ContractFactory and Signers here.
  //   const crowdfundingProjectForEach = await ethers.getContractFactory("CrowdfundingProject");
  //   [addr1ForEach, addr2ForEach, ...addrs] = await ethers.getSigners();

  //   // To deploy our contract, we just have to call CrowdfundingProject.deploy() and await it to get the contract instance.
  //   crowdfundingProjectForEach = await crowdfundingProjectForEach.deploy();
  //   await crowdfundingProjectForEach.deployed();
  // });

  // afterEach(async function () {
  //   // The contract instance is destroyed here, or can be reset
  //   crowdfundingProjectForEach = null;
  // });


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
        Math.floor(Date.now() / 1000) + ONE_DAY,
        ethers.utils.parseEther('0.1'),
        0, // Ether as currency
        '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
      );
      const project = await crowdfundingProject.projects(0);
      expect(project.name).to.equal('Test Project');
    });

    // Add more tests for different scenarios...
  });

  describe('Setting Platform Fee', function () {
    it('Should set the platform fee successfully', async function () {
      await crowdfundingProject.connect(owner).setPlatformFee(10);
      expect(await crowdfundingProject.fee()).to.equal(10);
    });
  });

  describe('Setting Valid Currency', function () {
    let validToken;

    beforeEach(async function () {
      const ERC20 = await ethers.getContractFactory('SimpleERC20');
      validToken = await ERC20.deploy(ethers.utils.parseEther('10000'));
      await validToken.deployed();
    });

    it('Should set valid currency successfully', async function () {
      await crowdfundingProject
        .connect(owner)
        .setValidCurrency(validToken.address, true);
      expect(
        await crowdfundingProject.validERC20Tokens(validToken.address)
      ).to.equal(true);
    });
  });

  describe('Contributing to a project', function () {
    it('Should contribute to a project successfully', async function () {
      // contribute with address 1
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });
      const project = await crowdfundingProject.projects(0);
      expect(project.totalContributions).to.equal(
        ethers.utils.parseEther('12')
      );
    });
  });

  describe('Withdrawing Funds', function () {
    it('Should withdraw funds successfully', async function () {
      await crowdfundingProject.connect(addr1).contribute(0, {
        value: ethers.utils.parseEther('12'),
      });

      // 2 days have passed the project was created so the deadline has passed.
      await ethers.provider.send('evm_increaseTime', [2 * ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect

      // Assumes sufficient contributions to the project.
      await crowdfundingProject.connect(owner).withdrawFunds(0);

      const project = await crowdfundingProject.projects(0);

      expect(project.fundsWithdrawn).to.equal(true);
    });
  });

  describe('Injecting Rewards', function () {
    it('Should inject rewards successfully', async function () {
      await crowdfundingProject
        .connect(owner)
        .injectRewards(0, { value: ethers.utils.parseEther('1') });
      const project = await crowdfundingProject.projects(0);
      expect(project.fundsInjected).to.equal(ethers.utils.parseEther('1'));
    });
  });

  describe('Claiming Rewards', function () {
    it('Should claim rewards successfully', async function () {
      // Create new project
      await crowdfundingProject.createProject(
          'Test Project 2',
          'Test Description 2',
          ethers.utils.parseEther('10'),
          Math.floor(Date.now() / 1000) + ONE_DAY * 3, // Ensure the deadline is in the future
          ethers.utils.parseEther('0.1'),
          0, // Ether as currency
          '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
      );

      // Contribute to the project, enough to reach the goal
      await crowdfundingProject.connect(addr1).contribute(1, {
          value: ethers.utils.parseEther('7'),
      });
      await crowdfundingProject.connect(addr2).contribute(1, {
        value: ethers.utils.parseEther('3'),
      });

      // Increase time so that the deadline has passed
      await ethers.provider.send('evm_increaseTime', [3 * ONE_DAY]);
      await ethers.provider.send('evm_mine'); // Mine the next block so the time change takes effect

      // Inject rewards after the deadline
      await crowdfundingProject
          .connect(owner)
          .injectRewards(1, { value: ethers.utils.parseEther('1') });

      // Claim rewards
      await crowdfundingProject.connect(addr1).claimRewards(1);
      const project = await crowdfundingProject.projects(1);

      expect(project.fundsInjected).to.equal(
        ethers.utils.parseEther('1')
      );
    });

    it('Should not be able to claim rewards twice', async function () {
        // Try to claim rewards again and verify the transaction fails
        await expect(crowdfundingProject.connect(addr1).claimRewards(1)).to.be.reverted;
    });

    it('Should not be able to claim rewards without funds injection', async function () {
        // Create new project with a future deadline
        await crowdfundingProject.createProject(
            'Test Project 3',
            'Test Description 3',
            ethers.utils.parseEther('10'),
            Math.floor(Date.now() / 1000) + ONE_DAY * 6, // Ensure the deadline is in the future
            ethers.utils.parseEther('0.1'),
            0, // Ether as currency
            '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
        );

        // Contribute to the project
        await crowdfundingProject.connect(addr1).contribute(2, {
            value: ethers.utils.parseEther('5'),
        });

        // Try to claim rewards without funds injection and verify the transaction fails
        // No need to increase time here, as the contract should already prevent claiming without funds
        await expect(crowdfundingProject.connect(addr1).claimRewards(2)).to.be.reverted;
    });
  });


  // estos tests estan god, no borrar, hay que cambiar el tema de las fechas
  // describe ('Claiming Rewards', function () {
  //   it('Should allow contributors to claim back their contribution if goal is not met after deadline', async function () {
  //     await crowdfundingProject.createProject(
  //       'Test Project 4',
  //       'Test Description 4',
  //       ethers.utils.parseEther('10'),
  //       Math.floor(Date.now() / 1000) + ONE_DAY * 6, // Ensure the deadline is in the future
  //       ethers.utils.parseEther('0.1'),
  //       0, // Ether as currency
  //       '0x0000000000000000000000000000000000000000' // Dummy ERC20 token address
  //     );
      
  //     // Contribute to the project first.
  //     await crowdfundingProject.connect(addr1).contribute(4, {
  //         value: ethers.utils.parseEther('1'),
  //     });
  
  //     // Simulate deadline passing and project goal not met.
  //     await ethers.provider.send('evm_increaseTime', [2 * ONE_DAY]);
  //     await ethers.provider.send('evm_mine');
  
  //     const beforeBalance = await ethers.provider.getBalance(addr1.address);
  //     await crowdfundingProject.connect(addr1).claimContribution(0);
  //     const afterBalance = await ethers.provider.getBalance(addr1.address);
  
  //     expect(afterBalance).to.gt(beforeBalance);
  //   });

  //   it('Should prevent the same contributor from claiming their contribution twice', async function () {
  //     // Contribute to the project first.
  //     await crowdfundingProject.connect(addr1).contribute(0, {
  //         value: ethers.utils.parseEther('1'),
  //     });
  
  //     // Simulate deadline passing and project goal not met.
  //     await ethers.provider.send('evm_increaseTime', [2 * ONE_DAY]);
  //     await ethers.provider.send('evm_mine');
  
  //     await crowdfundingProject.connect(addr1).claimContribution(0);
  
  //     // Try to claim contribution again, should revert.
  //     await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('You have not made any contributions');
  //   });
  
  //   it('Should prevent contributors from claiming their contribution before deadline', async function () {
  //     // Contribute to the project first.
  //     await crowdfundingProject.connect(addr1).contribute(0, {
  //         value: ethers.utils.parseEther('1'),
  //     });
  
  //     // Try to claim contribution before deadline, should revert.
  //     await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('Cannot claim contribution before deadline');
  //   });
  
  //   it('Should prevent contributors from claiming their contribution if project has reached its goal', async function () {
  //     // Contribute to the project first.
  //     await crowdfundingProject.connect(addr1).contribute(0, {
  //         value: ethers.utils.parseEther('12'),
  //     });
  
  //     // Simulate deadline passing and project goal is met.
  //     await ethers.provider.send('evm_increaseTime', [2 * ONE_DAY]);
  //     await ethers.provider.send('evm_mine');
  
  //     // Try to claim contribution, should revert.
  //     await expect(crowdfundingProject.connect(addr1).claimContribution(0)).to.be.revertedWith('Cannot claim contribution if the project had reached the financial goal');
  //   });
  
  // });


  // describe('Claiming Rewards', function () {
  //   it('Should claim rewards successfully', async function () {
  //    ...
  //   });
  // });

  // describe('Claiming Contributions', function () {
  //   it('Should claim contributions successfully', async function () {
  //     ...
  //   });
  // });

  // describe('Withdrawing Platform Fee', function () {
  //   it('Should withdraw platform fee successfully', async function () {
  //     ...
  //   });
  // });
});
