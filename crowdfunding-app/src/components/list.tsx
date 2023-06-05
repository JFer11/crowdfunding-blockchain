import React, { useState } from 'react';
import cfContract from '../pages/crowdfunding'
//import { ethers } from 'ethers';

const ObjectList = ({ projectsList, projectsCount }) => {

    const [showList, setShowList] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [deadline, setDeadline] = useState('');
    const [minimumContribution, setMinimumContribution] = useState('');

    const newProjectHandler = () => {
        setShowList(false)
        setShowForm(true)
    }

    const cancelNewProjectHandler = () => {
        setShowForm(false)
        setShowList(true)
    }

    const createProjectHandler = async () => {
        try {
            const parsedGoal = ethers.utils.parseEther(goal);
            const parsedDeadline = Math.floor(new Date(deadline).getTime() / 1000);
            const parsedMinimumContribution = ethers.utils.parseEther(minimumContribution);
            await cfContract.methods.createProject(name, description, parsedGoal, parsedDeadline, parsedMinimumContribution, CurrencyType.ETHER, { gasLimit: 300000 }).call();

            // Reset the form fields after successful creation
            setName('');
            setDescription('');
            setGoal('');
            setDeadline('');
            setMinimumContribution('');

            // Show a success message or perform any other actions
            alert('Project created successfully!');
        } catch (err: any) {
            alert(err)
        }
    }

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
                            <th>Project Name</th>
                            <th>Project Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectsList.map((project: any, index: any) => (
                            <tr key={index}>
                                <td>{project.name}</td>
                                <td>{project.description}</td>
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
                            <input className="input" type="number" step="0.01" value={goal} onChange={(e) => setName(e.target.value)} />
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
        </div>
    );
};

export default ObjectList;