import React from 'react'
import { Link } from 'react-router-dom'

export default function Home () {
  return (
    <div className='h-full w-full flex justify-center items-center flex-col'>
      <Link
        className='text-center w-80 block text-4xl p-4 rounded-md uppercase bg-sky-500 hover:bg-sky-400 text-white font-bold m-2'
        to='/create'
      >
        Create Game
      </Link>
      <Link
        className='text-center w-80 block text-4xl p-4 rounded-md uppercase bg-rose-600 hover:bg-rose-500 text-white font-bold m-2'
        to='/join'
      >
        Join Game
      </Link>
    </div>
  )
}
