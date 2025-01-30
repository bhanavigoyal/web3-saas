"use client";
import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { Toaster } from 'react-hot-toast';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "");

  const wallets = useMemo(
      () => [],
      [network]
  );

    return (
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <Toaster position='top-right'/>
                {children}
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
  );
}