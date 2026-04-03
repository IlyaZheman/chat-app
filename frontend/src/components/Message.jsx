export const Message = ({ messageInfo }) => {
  return (
    <div>
      <span>{messageInfo.userName}</span>
      <div>
        {console.log(messageInfo)}
        {messageInfo.message}
      </div>
    </div>
  );
}