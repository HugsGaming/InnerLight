"use client";

import React, { useState } from 'react'
import ChatListComponent from './ChatListComponent'
import ChatChannelComponent from './ChatChannelComponent'

export default function ChatComponent() {
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  return (
    <div className='p-10 ml-14 mt-10 md:ml-64 flex flex-row '>
        <div className='w-1/3'>
          <ChatListComponent onSelectFriend={setSelectedFriend} />
        </div>
        <div className='w-2/3'>
          <ChatChannelComponent friend={selectedFriend} />
        </div>
    </div>
  )
}
