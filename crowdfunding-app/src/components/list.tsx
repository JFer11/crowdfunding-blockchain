import React from 'react';

const ObjectList = ({ projectsList, projectsCount }) => {
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
                    <p className="level-item"><strong>All</strong></p>
                    <p className="level-item"><a>Deleted</a></p>
                    <p className="level-item"><a className="button is-success">New</a></p>
                </div>
            </nav>
            <table className="table is-hoverable is-fullwidth">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Project Description</th>
                    </tr>
                </thead>
                <tbody>
                    {projectsList.map((project, index) => (
                        <tr key={index}>
                            <td>{project.name}</td>
                            <td>{project.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ObjectList;