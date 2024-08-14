'use client'

import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  MessageModel,
  TypingIndicator
} from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import OpenAI from 'openai'
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index.mjs'
import { useEffect, useState } from 'react'

const Chat = () => {
  /**OpenAIのインスタンスを作成 */
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  })

  const defaultMessage: MessageModel = {
    message: 'チャットに商品とその特徴を入力してください',
    sender: 'ChatGPT',
    direction: 'incoming',
    position: 'normal'
  }
  const [typing, setTyping] = useState<boolean>(false)
  const [messages, setMessages] = useState<MessageModel[]>([defaultMessage])

  /**ローカルストレージからメッセージリストを取得 */
  useEffect(() => {
    const saveMessages = localStorage.getItem('messages')
    if (saveMessages) {
      setMessages(JSON.parse(saveMessages))
    }
  }, [])
  /** OpenAIに送信する関数*/
  const sendMessageToChatGPT = async (chatMessages: MessageModel[]) => {
    type ChatMessageProps = {
      role: 'user' | 'assistant' | 'system'
      content: string
      name: string
    }

    /** ChatGPTの役割を初期設定*/
    const systemMessage: ChatMessageProps = {
      role: 'system',
      content:
        '日本語で答えてください。あなたは一流の広告ライターです。水平思考を駆使して、自然で読みやすい、最高に魅力的な、商品説明文を作ってください。',
      name: 'system'
    }

    /** ユーザーかChatGPTかを判定*/
    let apiMessages = chatMessages.map((messageObj: MessageModel) => {
      let role: 'user' | 'assistant' = 'user'
      if (messageObj.sender === 'ChatGPT') {
        role = 'assistant'
      }

      return {
        role: role,
        content: messageObj.message || '',
        name: role
      }
    })

    /** ChatGPTに送信する*/
    const apiRequestBody: ChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...apiMessages]
    }

    try {
      const response = await openai.chat.completions.create(apiRequestBody)
      const data = response.choices[0].message.content
      setMessages([
        ...chatMessages,
        {
          message: String(data),
          sender: 'ChatGPT',
          direction: 'incoming',
          position: 'normal'
        }
      ])

      localStorage.setItem(
        'messages',
        JSON.stringify([
          ...chatMessages,
          {
            message: String(data),
            sender: 'ChatGPT',
            direction: 'incoming',
            position: 'normal'
          }
        ])
      )
    } catch (error) {
      alert(error)
    }

    setTyping(false)
  }

  /**送信処理を追加 */
  const onSubmit = async (message: string) => {
    const newMessage: MessageModel = {
      message: message,
      sender: 'user',
      direction: 'outgoing',
      position: 'normal'
    }

    const newMessages = [...messages, newMessage]

    setMessages(newMessages)
    setTyping(true)
    await sendMessageToChatGPT(newMessages)
  }

  /**全メッセージの削除処理を追加 */
  const onResetData = async () => {
    const isDelete: boolean = confirm('前メッセージを削除しますか？')
    if (isDelete) {
      localStorage.removeItem('messages')
      setMessages([defaultMessage])
      setTyping(false)
    }
  }
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex w-[800px] h-[800px]">
        <MainContainer className="flex-grow">
          <ChatContainer>
            {/* 生成AIの入力判定を追加 */}
            <MessageList
              typingIndicator={
                typing ? (
                  <TypingIndicator content="生成AIが入力しています。" />
                ) : null
              }
            >
              {messages.map((message: MessageModel, i) => (
                <Message key={i} model={message} />
              ))}
            </MessageList>
            <MessageInput
              placeholder="質問を記入してください。"
              //   送信処理を追加
              onSend={onSubmit}
              className="w-full"
            />
          </ChatContainer>
        </MainContainer>
        {/* 削除ボタンを追加 */}
        <div className="ml-2">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
            onClick={onResetData}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
