import React from 'react'
import { Link, Outlet, Route, Routes, useParams } from 'react-router-dom'
import Create from './pages/Create.jsx'
import Game from './pages/Game.jsx'
import Home from './pages/Home.jsx'
import Join from './pages/Join.jsx'
import JoinGame from './pages/JoinGame.jsx'
import Manage from './pages/Manage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/:code" element={<JoinGame />} />
        <Route path="/game/:code" element={<Game />} />
        <Route path="/game/:code/manage" element={<Manage />} />
        <Route path="/game/:code/new" element={<Create />} />
      </Route>
    </Routes>
  )
}

function Layout() {
  return (
    <div className="h-screen-dvh h-dcreen w-screen flex p-1">
      <Outlet />
    </div>
  )
}
