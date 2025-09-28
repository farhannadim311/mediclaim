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

import React from 'react';
import { Header } from './Header';

/**
 * Provides layout for the bulletin board application.
 */
export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen overflow-hidden">
      <div className="px-10 relative h-full">
        <img
          src="/logo-render.png"
          alt="logo-image"
          height={607}
          className="absolute z-10 left-[2vw] top-[5vh]"
        />
        <div className="z-[999] relative flex justify-center gap-[5px] items-center h-full py-[10vh] px-[15vw]">
          {children}
        </div>
      </div>
    </div>
  );
};
