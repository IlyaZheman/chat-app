import { Button, CloseButton, Heading, Input } from "@chakra-ui/react";
import { Message } from "./Message";
import { useState } from "react";

export const Chat = ({ messages, chatRoom, closeChat, sendMessage }) => {
  const [message, setMessage] = useState("");

  const onSendMessage = () => {
    sendMessage(message);
    setMessage("");
  };

  return (
    <div>
      <div>
        <Heading>{chatRoom}</Heading>
        <CloseButton onClick={closeChat} />
      </div>
      <div>
        {messages.map((messageInfo, index) => (
          <Message messageInfo={messageInfo} key={index} />
        ))}
      </div>
      <div>
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите сообщение"
        />
        <Button onClick={onSendMessage}>Отправить</Button>
      </div>
    </div>
  );
}