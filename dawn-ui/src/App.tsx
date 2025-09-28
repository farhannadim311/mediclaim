// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState } from 'react';
import { MainLayout } from './components';
import Landing from './components/Landing';
import ReportDetail from '@/components/ReportDetail';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import SplashScreen from './components/SplashScreen';
import { useDeployedBoardContext } from './hooks';
import { type BoardDeployment } from './contexts';
import { type Observable } from 'rxjs';
import NewReport from './components/NewReport';
import { ClaimVerifier } from './components/ClaimVerifier';
import PolicyManagement from './components/PolicyManagement';
import { initWitnesses } from '../../contract/src';

/**
 * The root bulletin board application component.
 *
 * @remarks
 * The {@link App} component requires a `<DeployedBoardProvider />` parent in order to retrieve
 * information about current bulletin board deployments.
 *
 * @internal
 */
const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [boardDeployments, setBoardDeployments] = useState<Array<Observable<BoardDeployment>>>([]);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  console.log('boardDeployments');

  useEffect(() => {
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    console.log('contractAddress', contractAddress);

    boardApiProvider.resolve(contractAddress)


    const witnessResult = initWitnesses();
    console.log('witnessResult', witnessResult);



  }, []);

  

  useEffect(() => {
    const subscription = boardApiProvider.boardDeployments$.subscribe(setBoardDeployments);

    return () => {
      subscription.unsubscribe();
    };
  }, [boardApiProvider]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="bg-black min-h-screen">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <Header />
      <Routes>
        <Route path="/report/:reportId" element={<ReportDetail />} />
        <Route
          path="/reports/new"
          element={
            <NewReport />
          }
        />
        <Route
          path="/claims"
          element={
            <ClaimVerifier />
          }
        />
        <Route
          path="/attestation"
          element={
            <ClaimVerifier />
          }
        />
        <Route
          path="/policies"
          element={
            <PolicyManagement />
          }
        />
        <Route
          path="/"
          element={
              <Landing />
          }
        />
      </Routes>
      {/* )} */}
    </div>
  );
};



export default App;
