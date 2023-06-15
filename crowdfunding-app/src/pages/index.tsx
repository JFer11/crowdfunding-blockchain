import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Web3 from 'web3'
import cfContract from '../pages/crowdfunding'
import 'bulma/css/bulma.css'
import { useEffect, useState } from 'react'
import ObjectList from '@/components/list'
import Admin from '@/components/admin'
import { ethers } from 'ethers';

const Home = () => {

  const [error, setError] = useState([]);
  const [walletAddress, setWallet] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [projectsCount, setProjectsCount] = useState('');
  let web3;
  const [projectsList, setProjectsList] = useState([]);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);

  useEffect(() => {
    fetchEvents();
    getProjectsHandler();
    const ownerAddress = getOwnerAddress();
    //console.log(ownerAddress);
    setOwnerAddress(ownerAddress);
    const currentAddress = getCurrentWalletConnected();
    setWallet(currentAddress);

  }, []);

  const connectWalletHandler = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        const addressArray = await window.ethereum.request({ method: 'eth_requestAccounts' })
        web3 = new Web3(window.ethereum);
        setWallet(addressArray[0]);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      //Metamask not installed
      setError('Please install MetaMask')
    }
  }

  const fetchEvents = async () => {
    const results = await cfContract.getPastEvents('ProjectCreated', { fromBlock: 0, toBlock: 'latest' });
    console.log(results);
    setProjectsList(results);
  };

  const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
      try {
        const addressArray = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (addressArray.length > 0) {
          return addressArray[0].toString()
        } else {
          return ''
        }
      } catch (err) {
        console.log((err.message).toString)
      }
    } else {
      return 'Please install MetaMask'
    }
  };

  const getOwnerAddress = async () => {
    try {
      const owner = await cfContract.methods.owner().call();
      return owner;
    } catch (error) {
      console.error('Error retrieving owner address:', error);
    }
  }

  const getProjectsHandler = async () => {
    //Get the Projects count
    const projectsCount = await cfContract.methods.projectCount().call();
    setProjectsCount(projectsCount);
  }

  return (
    <div className={styles.main}>
      <Head>
        <title>Crowdfunding DApp</title>
        <meta name="description" content="A blockchain crowdfunding app" />
      </Head>
      <nav className="navbar">
        <div className='container mt-4 mb-4'>
          <div className='navbar-brand'>
            <h1>Crowdfunding DApp</h1>
          </div>
          <div className='navbar-end'>
            <button onClick={connectWalletHandler} className='button is-primary'>
              {walletAddress.length > 0 ? (
                "Connected: " +
                String(walletAddress).substring(0, 6) +
                "..." +
                String(walletAddress).substring(38)
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          </div>
        </div>
      </nav>
      <section>
        {ownerAddress?.toString().toLowerCase() == walletAddress?.toString().toLowerCase() ?
          <div className='container mt-4'>
            <Admin projectsList={projectsList} projectsCount={projectsCount} />
          </div>
          :
          <div className='container mt-4'>
            <ObjectList projectsList={projectsList} projectsCount={projectsCount} />
          </div>
        }
      </section>
      <section>
        <div className='container has-text-danger'>
          <p>{error}</p>
        </div>
      </section>
    </div>
  )
}

export default Home;
