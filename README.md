# Web3 SAAS

## Overview

**Web3 SAAS** is a platform designed to help YouTubers enhance their content engagement by providing a thumbnail voting system. This system allows YouTubers to upload multiple thumbnail options and gather feedback from viewers, enabling data-driven decisions to boost video click rates. The platform also includes secure payment integration and efficient content delivery.

## Features

- **Thumbnail Voting System**: Upload multiple thumbnail options and gather viewer feedback to choose the most engaging images.
- **Solana-Based Payment Integration**: Securely process payments for thumbnail uploads and distribute compensation to users who vote.
- **AWS Integration**: Utilize AWS S3 and CloudFront for secure image uploads and fast content delivery.

## Tools and Technologies

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Express.js, Web3.js
- **Database**: Prisma, PostgreSQL
- **Cloud Services**: AWS S3, CloudFront
- **Blockchain**: Solana

## Installation

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- PostgreSQL
- AWS account (for S3 and CloudFront)
- Solana account (for payment integration)

### Clone the Repository

```bash
git clone https://github.com/yourusername/web3-saas.git
cd web3-saas
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Configure Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
DATABASE_URL=your_postgresql_database_url
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
AWS_CLOUDFRONT_URL=your_cloudfront_url
SOLANA_RPC_URL=your_solana_rpc_url
```

### Run Migrations

Apply database migrations using Prisma:

```bash
npx prisma migrate dev
```

### Start the Development Server

```bash
npm run dev
# or
yarn dev
```
Navigate to ``` http://localhost:3000 ``` to view the application.

## Usage

1. **Upload Thumbnails**: YouTubers can upload multiple thumbnail options through the platform. Use the provided interface to submit and manage your thumbnails.

2. **Vote on Thumbnails**: Viewers can view and vote on their preferred thumbnail options. The voting system is designed to be user-friendly and accessible.

3. **Review Feedback**: After voting, YouTubers can review feedback and analytics to determine which thumbnail is the most engaging. This data is crucial for making informed decisions about which thumbnail to use.

4. **Manage Payments**: Payments for thumbnail uploads are processed using Solana. YouTubers pay 1 SOL per thumbnail upload, and this amount is distributed to users who participate in the voting process. The payment system is integrated for secure and transparent transactions.

## Deployment

To deploy the application, follow these steps:

1. **Build the Application**

   ```bash
   npm run build
   # or
   yarn build
    ```

2. **Deploy to a Hosting Service**

   You can deploy the built application to a service like Vercel, AWS Amplify, or any other hosting provider of your choice. Here’s a general guide for deploying to these platforms:

   - **Vercel**:
     1. Sign in to your Vercel account and create a new project.
     2. Connect your GitHub repository to Vercel.
     3. Configure the project settings if needed and deploy.
   
   - **AWS Amplify**:
     1. Sign in to your AWS account and navigate to AWS Amplify.
     2. Click on “Get Started” and connect your GitHub repository.
     3. Configure the build settings and deploy the application.
   
   - **Other Hosting Providers**:
     Follow the hosting provider’s documentation for deployment procedures. Typically, you will need to upload the build files or connect your repository for continuous deployment.

     

