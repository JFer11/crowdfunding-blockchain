import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Web3 from 'web3'
import cfContract from '../pages/crowdfunding'
import 'bulma/css/bulma.css'
import { useEffect, useState } from 'react'
import ObjectList from '@/components/list'
import { ethers } from 'ethers';

const Home = () => {

  const [error, setError] = useState('');
  const [projectsCount, setProjectsCount] = useState('');
  let web3;
  const [projectsList, setProjectsList] = useState([
    { name: 'Project 1', description: 'Lorem Ipsum' },
    { name: 'Project 2', description: 'Lorem Ipsum' },
    { name: 'Project 3', description: 'Lorem Ipsum' },
  ]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      getProjectsHandler();
      const event = cfContract.events.ProjectCreated();

      event.on('ProjectCreated', (projectId, name, goal, deadline, ERC20Token, event) => {
        const newEvent = {
          projectId: projectId.toNumber(),
          name,
          goal: goal.toString(),
          deadline: deadline.toNumber(),
          ERC20Token,
          event: event.event,
        };

        setEvents((prevEvents) => [...prevEvents, newEvent]);
      });
    };

    fetchEvents();
  }, []);

  const connectWalletHandler = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        web3 = new Web3(window.ethereum)
      } catch (err: any) {
        setError(err.message)
      }
    } else {
      //Metamask not installed
      setError('Please install MetaMask')
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
            <button onClick={connectWalletHandler} className='button is-primary'>Connect Wallet</button>
          </div>
        </div>
      </nav>
      <section>
        <div className='container mt-4'>
          <ObjectList projectsList={projectsList} projectsCount={projectsCount} />
        </div>
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
