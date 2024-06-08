"use server";

import { nanoid } from "ai";
import { createAI, createStreamableUI, createStreamableValue } from "ai/rsc";
import { type ReactNode } from "react";
import { Message } from "./components/Message";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClientMessage {
  id: string;
  status: ReactNode;
  text: ReactNode;
}

const ASSISTANT_ID = "asst_OLEeQu24xGSw8MSMlb0rIh0h";
let THREAD_ID = "";
let RUN_ID = "";

export async function submitMessage(text: string): Promise<ClientMessage> {
  const statusUIStream = createStreamableUI("thread.init");

  const textStream = createStreamableValue("");
  const textUIStream = createStreamableUI(
    <Message textStream={textStream.value} />,
  );

  const runQueue = [];

  (async () => {
    if (THREAD_ID) {
      await openai.beta.threads.messages.create(THREAD_ID, {
        role: "user",
        content: text,
      });

      const run = await openai.beta.threads.runs.create(THREAD_ID, {
        assistant_id: ASSISTANT_ID,
        stream: true,
      });

      runQueue.push({
        id: nanoid(),
        run,
      });
    } else {
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        stream: true,
        thread: {
          messages: [
            {
              role: "user",
              content: text,
            },
          ],
        },
      });

      runQueue.push({
        id: nanoid(),
        run,
      });
    }

    while (runQueue.length > 0) {
      const latestRun = runQueue.shift();

      if (latestRun) {
        for await (const delta of latestRun.run) {
          const { data, event } = delta;

          statusUIStream.update(event);

          if (event === "thread.created") {
            THREAD_ID = data.id;
          } else if (event === "thread.run.created") {
            RUN_ID = data.id;
          } else if (event === "thread.message.delta") {
            data.delta.content?.map((part) => {
              if (part.type === "text") {
                textStream.append(part.text?.value as string);
              }
            });
          } else if (event === "thread.run.failed") {
            console.error(data);
          }
        }
      }
    }

    statusUIStream.done();
    textStream.done();
  })();

  return {
    id: nanoid(),
    status: statusUIStream.value,
    text: textUIStream.value,
  };
}

export const AI = createAI({
  actions: {
    submitMessage,
  },
});
