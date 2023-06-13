import React, { useEffect, useState } from 'react';
import cfContract from '../pages/crowdfunding'
import Web3 from 'web3';
import { ethers } from 'ethers';

const ObjectList = ({ projectsList, projectsCount }) => {

    const [walletAddress, setWallet] = useState('');
    const [showList, setShowList] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [acceptedTokens, setAcceptedTokens] = useState<any[]>([]);
    const [ownedProjects, setOwnedProjects] = useState<any[]>([]);

    //Create contract variables
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [deadline, setDeadline] = useState('');
    const [minimumContribution, setMinimumContribution] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [selectedToken, setSelectedToken] = useState('ETH');

    //Contribute variables
    const [showModal, setShowModal] = useState(false);
    const [projectToContribute, setProjectToContribute] = useState('');
    const [projectToContributeId, setProjectToContributeId] = useState('');
    const [contributionAmount, setContributionAmount] = useState('');

    //Contributions variables
    const [contributions, setContributions] = useState<any[]>([]);
    const [claimedContributions, setClaimedContributions] = useState<any[]>([]);
    const [currentAddressContributions, setCurrentAddressContributions] = useState<any[]>([]);

    //Injection variables
    const [isInjection, setIsInjection] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchAcceptedTokens();
        getCurrentWalletConnected();
        const newArray = projectsList.map(project => {
            return { ...project, deadlineDate: new Date(project.returnValues.deadline * 1000) };
        });
        setProjects(newArray);
        getContributionsHandler();
        getContributionsClaimedHandler();
        console.log(claimedContributions)
        getContributedProjectsByAddress();
    }, []);

    useEffect(() => {
        getOwnedProjectsByAddress();
    }, [projects]);

    const fetchEvents = async () => {
        const event = cfContract.events.ProjectCreated();
        event.on('data', function (event: any) {
            //console.log(event);
            const newArray = [...projects, event];
            setProjects(newArray);
        });
    }

    const getContributionsHandler = async () => {
        //Get all the contributions
        const results = await cfContract.getPastEvents('ContributionAdded', { fromBlock: 0, toBlock: 'latest' });
        setContributions(results);
    }

    const getContributionsClaimedHandler = async () => {
        //Get all the contributions
        const results = await cfContract.getPastEvents('ContributionClaimed', { fromBlock: 0, toBlock: 'latest' });
        setClaimedContributions(results);
    }

    const fetchAcceptedTokens = async () => {
        const results = await cfContract.getPastEvents('ValidERC20TokenSet', { fromBlock: 0, toBlock: 'latest' });
        setAcceptedTokens(results);
    }

    const newProjectHandler = () => {
        setShowList(false)
        setShowForm(true)
    }

    const cancelNewProjectHandler = () => {
        setShowForm(false)
        setShowList(true)
    }

    const getCurrentWalletConnected = async () => {
        if (window.ethereum) {
            try {
                const addressArray = await window.ethereum.request({
                    method: "eth_accounts",
                });
                if (addressArray.length > 0) {
                    setWallet(addressArray[0])
                } else {
                    setWallet('')
                }
            } catch (err: any) {
                return (err.message)
            }
        } else {
            return 'Please install MetaMask'
        }
    }

    const getOwnedProjectsByAddress = async () => {
        var auxArray = [];
        console.log(projects);
        for (var i = 0; i < projectsCount; i++) {
            if (projects[i]) {
                const project = await cfContract.methods.projects(projects[i].returnValues.projectId).call();
                //console.log(project);
                //console.log('project owner: ' + project.name);
                //console.log('project owner: ' + project.owner.toString().toLowerCase());
                //console.log('wallet: ' + walletAddress.toString().toLowerCase());
                if (project.owner.toString().toLowerCase() === walletAddress.toString().toLowerCase()) {
                    auxArray.push(projects[i].returnValues.projectId)
                }
            }
        }
        //console.log(auxArray);
        setOwnedProjects(auxArray);
    }

    const getContributedProjectsByAddress = async () => {
        var auxArray = [];
        for (var i = 0; i < contributions.length; i++) {
            if (contributions[i] && contributions[i].returnValues.contributor.toString().toLowerCase() === walletAddress.toString().toLowerCase()) {
                auxArray.push(contributions[i]);
            }
        }
        console.log(auxArray);
        setCurrentAddressContributions(auxArray);
    }

    const createProjectHandler = async () => {
        try {
            const parsedGoal = (goal);
            const parsedDeadline = Math.floor(new Date(deadline).getTime() / 1000);
            const parsedMinimumContribution = (minimumContribution);
            if (selectedToken === 'ETH') {
                const result = await cfContract.methods.createProject(name, description, parsedGoal, parsedDeadline, parsedMinimumContribution, 0, tokenAddress).send({ from: walletAddress, gas: '1000000' });
            } else {
                const result = await cfContract.methods.createProject(name, description, parsedGoal, parsedDeadline, parsedMinimumContribution, 1, tokenAddress).send({ from: walletAddress, gas: '1000000' });
            }
            const newArray = [...projects, result.events.ProjectCreated];
            setProjects(newArray);

            // Reset the form fields after successful creation
            setName('');
            setDescription('');
            setGoal('');
            setDeadline('');
            setMinimumContribution('');

            // Show a success message or perform any other actions
            alert('Project created successfully!');
            cancelNewProjectHandler();
        } catch (err: any) {
            alert(err)
        }
    }

    const contributeHandler = async () => {
        try {
            const web3 = new Web3('HTTP://127.0.0.1:7545');
            const parsedContributionAmount = web3.utils.toWei(contributionAmount, 'ether');
            const contributeTx = await cfContract.methods.contribute(projectToContributeId).send({
                from: walletAddress,
                value: parsedContributionAmount,
            });
            var newArray = [...contributions, contributeTx.events.ContributionAdded];
            setContributions(newArray);
            newArray = [];
            newArray = [...currentAddressContributions, contributeTx.events.ContributionAdded];
            setCurrentAddressContributions(newArray);
            //console.log(contributeTx);

            // Reset the form fields after successful creation
            setContributionAmount('');
            setProjectToContribute('');
            setProjectToContributeId('');

            // Show a success message or perform any other actions
            alert('Thanks for contributing!');
        } catch (err: any) {
            alert(err)
        }
    }

    const injectionHandler = async () => {
        try {
            const web3 = new Web3('HTTP://127.0.0.1:7545');
            const parsedContributionAmount = web3.utils.toWei(contributionAmount, 'ether');
            const contributeTx = await cfContract.methods.injectRewards(projectToContributeId).send({
                from: walletAddress,
                value: parsedContributionAmount,
            });
            console.log(contributeTx);

            // Reset the form fields after successful creation
            setContributionAmount('');
            setProjectToContribute('');
            setProjectToContributeId('');
            setIsInjection(false);

            // Show a success message or perform any other actions
            alert('Injection successful!');
        } catch (err: any) {
            alert(err)
        }
    }

    const withdrawHandler = async (projectId: any) => {
        try {
            if (currentAddressContributions.some((contribution) => Object.values(contribution.returnValues.projectId).includes(projectId))) {
                //user contributed to selected project
                const web3 = new Web3('HTTP://127.0.0.1:7545');
                const project = await cfContract.methods.projects(projectId).call();
                //console.log(project)
                const today = new Date();
                const projDeadline = new Date(project.deadline * 1000);
                if (today.getTime() > projDeadline.getTime()) {
                    //deadline was reached
                    if (web3.utils.fromWei(project.totalContributions, 'ether') > project.goal) {
                        //Goal has been reached so user can claim rewards or withdraw funds
                        if (project.owner.toString().toLowerCase() === walletAddress.toString().toLowerCase()) {
                            const funds = await cfContract.methods.withdrawFunds(projectId).send({ from: walletAddress });
                            alert('Funds retrieved successfully!');
                        } else {
                            const reward = await cfContract.methods.claimRewards(projectId).send({ from: walletAddress });
                            alert('Rewards claimed successfully!');
                        }
                    } else {
                        const hasClaimed = checkIfAddressHasClaimed(projectId);
                        if (!hasClaimed) {
                            const reward = await cfContract.methods.claimContribution(projectId).send({ from: walletAddress });
                            const newArray = [...claimedContributions, reward.events.ContributionClaimed];
                            setClaimedContributions(newArray);
                        } else {
                            alert('You have already claimed your contribution.')
                        }
                    }
                } else {
                    //deadline is yet to be reached
                    alert('Deadline has not been reached yet.')
                }
            } else {
                //user not contributed to selected project
                alert('You have not contributed to this project.')
            }
        } catch (err: any) {
            alert(err)
        }
    }

    const checkIfAddressHasClaimed = (projectId) => {
        for (var i = 0; i < claimedContributions.length; i++) {
            if (claimedContributions[i] && claimedContributions[i].returnValues.projectId == projectId && claimedContributions[i].returnValues.claimant.toString().toLowerCase() === walletAddress.toString().toLowerCase()) {
                return true
            } else {
                return false
            }
        }
    }

    const toggleContribute = async (projectName: any, projectId: any) => {
        setProjectToContribute(projectName);
        setProjectToContributeId(projectId);
        setShowModal(true);
    }

    const hideModal = async () => {
        setIsInjection(false);
        setShowModal(false);
    }

    const toggleInject = async (projectName: any, projectId: any) => {
        setProjectToContribute(projectName);
        setProjectToContributeId(projectId);
        setIsInjection(true);
        setShowModal(true);
    }

    const handleOptionChange = (event) => {
        setSelectedToken(event.target.value);
    };

    return (
        <div>
            <nav className="level">
                <div className="level-left">
                    <div className="level-item">
                        <p className="subtitle is-5">
                            <strong>{projectsCount}</strong> projects
                        </p>
                    </div>
                    <div className="level-item">
                        <div className="field has-addons">
                            <p className="control">
                                <input className="input" type="text" placeholder="Find a project" />
                            </p>
                            <p className="control">
                                <button className="button">
                                    Search
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="level-right">
                    <button onClick={newProjectHandler} className='button is-primary'>New</button>
                </div>
            </nav>
            {showList &&
                <table className="table is-hoverable is-fullwidth">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Deadline</th>
                            <th>Goal</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project: any, index: any) => (
                            <tr key={index}>
                                <td>{project.returnValues.name}</td>
                                <td>{project.deadlineDate.toString()}</td>
                                <td>{project.returnValues.goal}</td>
                                {ownedProjects.some((ownedProject) => Object.values(ownedProject).includes(project.returnValues.projectId)) ?
                                    <td align='center'><button onClick={() => toggleInject(project.returnValues.name, project.returnValues.projectId)} className='button is-info'>Inject</button></td>
                                    :
                                    <td align='center'><button onClick={() => toggleContribute(project.returnValues.name, project.returnValues.projectId)} className='button is-info'>Contribute</button></td>
                                }
                                <td align='center'><button onClick={() => withdrawHandler(project.returnValues.projectId)} className='button is-info'>Withdraw</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            {showForm &&
                <div>
                    <div className="field">
                        <label className="label">Name</label>
                        <div className="control">
                            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Description</label>
                        <div className="control">
                            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Funding Goal (ETH):</label>
                        <div className="control">
                            <input className="input" type="number" step="0.01" value={goal} onChange={(e) => setGoal(e.target.value)} />
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Deadline</label>
                        <div className="control">
                            <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Minimum Contribution (ETH):</label>
                        <div className="control">
                            <input className="input" type="number" step="0.01" value={minimumContribution} onChange={(e) => setMinimumContribution(e.target.value)} />
                        </div>
                    </div>

                    <div className="field">
                        <div className="control">
                            <label className="radio">
                                <input type="radio" name="question" value="ETH" checked={selectedToken === 'ETH'} onChange={handleOptionChange} />
                                ETH
                            </label>
                            <label className="radio">
                                <input type="radio" name="question" value="ERC Token" checked={selectedToken === 'ERC Token'} onChange={handleOptionChange} />
                                ERC Token
                            </label>
                        </div>
                    </div>

                    <div className="field">
                        <label className="label">Accepted Token</label>
                        <div className="control">
                            <div className="select">
                                <select value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}>
                                    {acceptedTokens.map((token: any, index: any) => (
                                        <option key={token.returnValues.address}>{token.returnValues.ERC20Token}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="field is-grouped">
                        <div className="control">
                            <button onClick={createProjectHandler} className="button is-link">Submit</button>
                        </div>
                        <div className="control">
                            <button onClick={cancelNewProjectHandler} className="button is-link is-light">Cancel</button>
                        </div>
                    </div>
                </div>
            }
            <div className={showModal ? 'modal is-active' : 'modal'}>
                <div className="modal-background"></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p className="modal-card-title">Contribute to {projectToContribute}</p>
                        <button onClick={hideModal} className="delete" aria-label="close"></button>
                    </header>
                    <section className="modal-card-body">
                        <div className="field">
                            <label className="label">Amount (ETH):</label>
                            <div className="control">
                                <input className="input" type="number" step="0.01" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
                            </div>
                        </div>
                    </section>
                    <footer className="modal-card-foot">
                        <button onClick={isInjection ? injectionHandler : contributeHandler} className="button is-success">Contribute</button>
                        <button onClick={hideModal} className="button">Cancel</button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default ObjectList;