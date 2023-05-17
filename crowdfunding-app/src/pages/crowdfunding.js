import Head from 'next/head'
import Web3 from 'web3'
import 'bulma/css/bulma.css'
import styles from '../styles/CrowdFunding.module.css'
import { useState } from 'react'

const crowdfunding = () => {

    const [error, setError] = useState('')
    let web3

    const connectWalletHandler = async () => {
        if(typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'){
            try{
                await window.ethereum.request({ method: 'eth_requestAccounts' })
                web3 = new Web3(window.ethereum)
            }catch(err){
                setError(err.message)
            }
        }else {
            //Metamask not installed
            setError('Please install MetaMask')
        }
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
                <div className='container'>
                    <p>placeholder text</p>
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

export default crowdfunding;