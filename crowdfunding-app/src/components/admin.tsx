import React, { useEffect, useState } from 'react';
import ObjectList from '@/components/list'
import cfContract from '../pages/crowdfunding'
import Web3 from 'web3';
import { ethers } from 'ethers';

const Admin = ({ projectsList, projectsCount }) => {

    const [showConfig, setShowConfig] = useState(true);
    const [walletAddress, setWallet] = useState('');
    const [comisionFee, setComisionFee] = useState('');
    const [newTokenAddress, setNewTokenAddress] = useState('');
    const [acceptedTokens, setAcceptedTokens] = useState<any>([]);

    //Modals booleans
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [showRetrieveModal, setShowRetrieveModal] = useState(false);

    //Retrieve variables
    const [tokenRetrieve, setTokenRetrieve] = useState('')
    const [selectedToken, setSelectedToken] = useState('ETH');

    const handleOptionChange = (event) => {
        setSelectedToken(event.target.value);
    };

    useEffect(() => {
        getComisionFeeHandler();
        fetchAcceptedTokens();
        getCurrentWalletConnected();
    }, []);

    const fetchAcceptedTokens = async () => {
        const results = await cfContract.getPastEvents('ValidERC20TokenSet', { fromBlock: 0, toBlock: 'latest' });
        console.log(results);
        setAcceptedTokens(results);
    };

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
    };

    const getComisionFeeHandler = async () => {
        //Get the Projects count
        const fee = await cfContract.methods.fee().call();
        setComisionFee(fee);
    }

    const handleTabChange = (tabName: any) => {
        if (tabName == 'configurations') {
            setShowConfig(true);
        } else {
            setShowConfig(false);
        }
    }

    const editComisionFeeHandler = () => {
        setShowFeeModal(true);
    }

    const hideFeeModal = () => {
        setShowFeeModal(false);
    }

    const newTokenHandler = () => {
        setShowTokenModal(true);
    }

    const hideTokenModal = () => {
        setShowTokenModal(false);
    }

    const retrieveHandler = () => {
        setShowRetrieveModal(true);
    }

    const hideRetrieveModal = () => {
        setShowRetrieveModal(false);
    }

    const changeComisionFeeHandler = async () => {
        try {
            const web3 = new Web3('HTTP://127.0.0.1:7545');
            const response = await cfContract.methods.setPlatformFee(comisionFee).send({ from: web3.utils.toChecksumAddress(walletAddress.toString()), gas: '1000000' });
            console.log(response);

            // Show a success message or perform any other actions
            alert('Comision fee successfully updated!');
            hideFeeModal();
        } catch (err: any) {
            alert(err)
        }
    }

    const addNewTokenHandler = async () => {
        try {
            const web3 = new Web3('HTTP://127.0.0.1:7545');
            const response = await cfContract.methods.setValidCurrency(newTokenAddress, true).send({ from: web3.utils.toChecksumAddress(walletAddress.toString()), gas: '1000000' });
            console.log(response);
            const newArray = [...acceptedTokens, response.events.ValidERC20TokenSet];
            setAcceptedTokens(newArray);
            setNewTokenAddress('');
            alert('New token successfully validated!');
            hideTokenModal();
        } catch (err: any) {
            alert(err)
        }
    }

    const withdrawPlatformFeeHandler = async () => {
        try {
            if (selectedToken === 'ETH') {
                const result = await cfContract.methods.createProject(0, '0x0000000000000000000000000000000000000000').send({ from: walletAddress });
            } else {
                const result = await cfContract.methods.createProject(1, tokenRetrieve).send({ from: walletAddress });
            }
            alert('Platform fees retrieved successfully!');
            hideRetrieveModal();
        } catch (err: any) {
            alert(err)
        }
    }

    return (
        <div>
            <div className="tabs is-centered">
                <ul>
                    <li onClick={(e) => handleTabChange(e.target.id)} className={showConfig ? 'is-active' : ''}><a id='configurations'>Configurations</a></li>
                    <li onClick={(e) => handleTabChange(e.target.id)} className={showConfig ? '' : 'is-active'}><a id='projects'>Projects</a></li>
                </ul>
            </div>
            {showConfig ?
                <div>
                    <div className="columns">
                        <div className="column">
                            Comision Fee: {comisionFee}%
                        </div>
                        <div className="column">
                            <button onClick={editComisionFeeHandler} className="button is-link">Edit</button>
                        </div>
                        <div className="column">
                            Accepted Tokens:
                            <ul>
                                {acceptedTokens.map((token: any, index: any) => (
                                    <li key={token.returnValues.address}>{token.returnValues.ERC20Token}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="column">
                            <button onClick={newTokenHandler} className="button is-link">Add New</button>
                        </div>
                        <div className="column">
                            <button onClick={retrieveHandler} className="button is-link">Retrieve Platform Fees</button>
                        </div>
                    </div>
                    <div className={showFeeModal ? 'modal is-active' : 'modal'}>
                        <div className="modal-background"></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">Change contribution fee</p>
                                <button onClick={hideFeeModal} className="delete" aria-label="close"></button>
                            </header>
                            <section className="modal-card-body">
                                <div className="field">
                                    <label className="label">New Fee (Percentage):</label>
                                    <div className="control">
                                        <input className="input" type="number" step="0.01" value={comisionFee} onChange={(e) => setComisionFee(e.target.value)} />
                                    </div>
                                </div>
                            </section>
                            <footer className="modal-card-foot">
                                <button onClick={changeComisionFeeHandler} className="button is-success">Save</button>
                                <button onClick={hideFeeModal} className="button">Cancel</button>
                            </footer>
                        </div>
                    </div>
                    <div className={showTokenModal ? 'modal is-active' : 'modal'}>
                        <div className="modal-background"></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">Add new accepted Token</p>
                                <button onClick={hideTokenModal} className="delete" aria-label="close"></button>
                            </header>
                            <section className="modal-card-body">
                                <div className="field">
                                    <label className="label">New Token (Address):</label>
                                    <div className="control">
                                        <input className="input" type="string" value={newTokenAddress} onChange={(e) => setNewTokenAddress(e.target.value)} />
                                    </div>
                                </div>
                            </section>
                            <footer className="modal-card-foot">
                                <button onClick={addNewTokenHandler} className="button is-success">Save</button>
                                <button onClick={hideTokenModal} className="button">Cancel</button>
                            </footer>
                        </div>
                    </div>
                    <div className={showRetrieveModal ? 'modal is-active' : 'modal'}>
                        <div className="modal-background"></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">Retrieve Platform Fee</p>
                                <button onClick={hideRetrieveModal} className="delete" aria-label="close"></button>
                            </header>
                            <section className="modal-card-body">
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
                                    <label className="label">Token to Retrieve</label>
                                    <div className="control">
                                        <div className="select">
                                            <select value={tokenRetrieve} onChange={(e) => setTokenRetrieve(e.target.value)}>
                                                {acceptedTokens.map((token: any, index: any) => (
                                                    <option key={token.returnValues.address}>{token.returnValues.ERC20Token}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <footer className="modal-card-foot">
                                <button onClick={withdrawPlatformFeeHandler} className="button is-success">Save</button>
                                <button onClick={hideRetrieveModal} className="button">Cancel</button>
                            </footer>
                        </div>
                    </div>
                </div>
                :
                <ObjectList projectsList={projectsList} projectsCount={projectsCount} />
            }
        </div>

    )
}

export default Admin;