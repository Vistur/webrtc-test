import { useState, useRef } from "react";
import "./styles.css";

const CHANNEL_STATES = { OPEN: "open" };

export default function App() {
  const [sendChannelState, setSendChannelState] = useState();
  const [localConnected, setLocalConnected] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState();
  const localConnection = useRef(null);
  const remoteConnection = useRef(null);
  const sendChannel = useRef(null);

  function onChannelStateChange(channel) {
    console.log(
      (channel === sendChannel.current ? "Send" : "Receive") +
        " channel state is: " +
        channel.readyState
    );
    setSendChannelState(channel.readyState);
  }

  return (
    <div className="App">
      <h1>WebRTC Test</h1>
      <button
        onClick={function connect() {
          console.log("Connecting");
          localConnection.current = new RTCPeerConnection();

          sendChannel.current = localConnection.current.createDataChannel(
            "sendChannel"
          );

          sendChannel.current.onopen = onChannelStateChange(
            sendChannel.current
          );
          sendChannel.current.onclose = onChannelStateChange(
            sendChannel.current
          );

          remoteConnection.current = new RTCPeerConnection();

          remoteConnection.current.ondatachannel = function receiveChannelCallback(
            e
          ) {
            console.log("ondatachannel");
            e.channel.onmessage = function onMessage(e) {
              console.log("New message: ", e);
              setMessages([...messages, JSON.parse(e.data)]);
              console.log("New meesages should be:", [
                ...messages,
                JSON.parse(e.data)
              ]);
              console.log("New meesages are:", messages);
            };
            e.channel.onopen = onChannelStateChange(e.channel);
            e.channel.onclose = onChannelStateChange(e.channel);
          };

          localConnection.current.onicecandidate = function (e) {
            console.log("localConnection onicecandidate", e);
            remoteConnection.current.addIceCandidate(e.candidate).then(
              () => {
                console.log("Add ICE local  candidate success");
                setLocalConnected(true);
              },
              () => {
                console.log("Add ICE local candidate failure");
              }
            );
          };

          remoteConnection.current.onicecandidate = function (e) {
            console.log("remoteConnection onicecandidate", e);
            localConnection.current.addIceCandidate(e.candidate).then(
              () => {
                console.log("Add ICE remote candidate success");
                setRemoteConnected(true);
              },
              () => {
                console.log("Add ICE remote candidate failure");
              }
            );
          };

          localConnection.current
            .createOffer()
            .then((offer) => localConnection.current.setLocalDescription(offer))
            .then(() =>
              remoteConnection.current.setRemoteDescription(
                localConnection.current.localDescription
              )
            )
            .then(() => remoteConnection.current.createAnswer())
            .then((answer) =>
              remoteConnection.current.setLocalDescription(answer)
            )
            .then(() =>
              localConnection.current.setRemoteDescription(
                remoteConnection.current.localDescription
              )
            )
            .catch(function handleCreateDescriptionError(e) {
              console.log("Create description error", e);
            });
        }}
        disabled={localConnected}
      >
        Connect
      </button>
      <button
        onClick={function disconnect() {
          console.log("Disconnecting");
        }}
        disabled={!remoteConnected}
      >
        Disconnect
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={sendChannelState === CHANNEL_STATES.open}
      />
      <button
        disabled={sendChannelState === CHANNEL_STATES.open}
        onClick={function sendMessage(e) {
          e.preventDefault();
          console.log("Sending message", e);
          sendChannel.current.send(JSON.stringify({ text }));
          setText("");
        }}
      >
        Send messgae
      </button>
      Messages:
      {messages.length > 0 && (
        <ul>
          {messages.map((message, i) => (
            <li key={i}>{message.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
