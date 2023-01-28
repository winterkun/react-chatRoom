import { useEffect, useState } from "react";
import { Form, useLoaderData, useFetcher } from "react-router-dom";
import { io } from "socket.io-client";
import { getContact, updateContact } from "../contacts";
function Favorite({ contact }) {
  const fetcher = useFetcher();
  // yes, this is a `let` for later
  let favorite = contact.favorite;
  return (
    <fetcher.Form method="post">
      <button
        name="favorite"
        value={favorite ? "false" : "true"}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
}
let socket;
let id;
export async function action({ request, params }) {
  let formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
}

export async function loader({ params }) {
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("", {
      status: 404,
      statusText: "Not Found",
    });
  }
  return contact;
}

function tryLog() {
  // console.log(123);
}
export default function Contact() {
  const [chat, setChat] = useState("");
  const [chatList, setChatList] = useState([]);
  //   const contact = {
  //     first: "Your",
  //     last: "Name",
  //     avatar: "https://placekitten.com/g/200/200",
  //     twitter: "your_handle",
  //     notes: "Some notes",
  //     favorite: true,
  //   };
  const contact = useLoaderData();

  const handleChatChange = (e, val) => {
    const value = val || e.target.value;
    setChat(value);
  };
  const handleSendMsg = (event) => {
    socket.emit("chat:msg", id, chat);
  };
  useEffect(() => {
    id = `id_${parseInt(Math.random() * 1000)}`;
    socket = io("ws://localhost:808/", {
      path: "/websocket",
      reconnectionDelayMax: 1000,
      auth: {
        token: "123",
      },
      query: {
        "my-key": "my-value",
      },
    });
    socket.on("connect", () => {
      socket.emit("chat:start", id, (data) => {
        console.log("连接成功");
      });
    });
    //新人进来
    socket.on("chat:add", (data) => {
       // 如果这个id,不等于我自己，我才去处理。
      data && ( [id] || console.log("上线通知", data));
    });
    //其他人的消息
    socket.on("chat:msg", (data) => {
      setChatList(chatList => [...chatList, data]);
    });
    socket.on('message', (msg) => {
      console.log('接收服务端消息：',msg)
    })
    return () => {
      socket.disconnect();
    };
  },[]);

  return (
    <div id="contact">
      <div className="flex flex-col w-96">
        <h2>:::chat:::</h2>
        <div className=" bg-gray-100 w-full flex flex-col">
          {chatList.map((item, idx) => (
            <div
              className={
                item.id === id
                  ? "bg-indigo-500 flex w-full justify-end"
                  : "bg-gray-200  w-full flex items-start "
              }
              key={idx + item.msg}
            >
              <span>{item.msg}</span>
            </div>
          ))}
        </div>
        <div>
          <input onChange={handleChatChange} value={chat} />
          <button onClick={handleSendMsg}>发送</button>
        </div>
      </div>
      <div>
        <img key={contact.avatar} src={contact.avatar || null} />
      </div>
      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
              {/* {contact.id} */}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>
        {contact.twitter && (
          <p>
            <a target="_blank" href={`https://twitter.com/${contact.twitter}`}>
              {contact.twitter}
            </a>
          </p>
        )}
        {contact.notes && <p>{contact.notes}</p>}
        <div>
          <Form onSubmit={tryLog} action="edit">
            <button type="submit">Edit</button>
          </Form>
          <Form
            method="post"
            action="destroy"
            onSubmit={(event) => {
              if (!confirm("Please confirm you want to delete this record.")) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}
