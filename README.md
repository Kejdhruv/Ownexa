# 🚀 Ownexa -- Blockchain-Based Real Estate Investment Platform

Ownexa is a decentralized real estate investment platform that enables
users to invest in properties through fractional ownership using
blockchain technology.

## 📌 Project Overview

Ownexa allows property owners to tokenize real estate assets into
digital tokens and investors to trade them.

## 🎯 Key Features

-   Fractional ownership
-   Primary & secondary market
-   Admin validation
-   MetaMask integration
-   Settlement & redemption
-   Future ML integration

## 🧱 Tech Stack

Frontend: React (Vite) Backend: Express + FastAPI Database: Supabase
Blockchain: Solidity, Hardhat, Ethers.js Network: Sepolia

## 📂 Folder Structure

    Ownexa/
    ├── Blockchain/
    ├── Backend/
    ├── ML_API/
    ├── Frontend/
    └── README.md

## ⚙️ Setup

### Frontend

cd Frontend npm install npm run dev

### Backend

cd Backend npm install npm start

### ML API

cd ML_API python3 -m uvicorn ml_api:app --reload

### Blockchain

cd Blockchain npm install npx hardhat compile npx hardhat run
scripts/deploy.js --network sepolia

## 👨‍💻 Developer

Dhruv Kejriwal

## 📄 License

MIT License
