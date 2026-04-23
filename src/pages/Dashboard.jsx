import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

import MainPanel from "../components/MainPanel";
import RightPanel from "../components/RightPanel";

function Dashboard() {
  return (
    <div className="flex h-screen bg-[url('/bg.jpg')] bg-cover">

      <Sidebar />

      <MainPanel />

      <RightPanel />

    </div>
  );
}

export default Dashboard;