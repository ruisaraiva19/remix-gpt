import type { V2_MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createId } from "@paralleldrive/cuid2";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Remix GPT" },
    { name: "description", content: "Welcome to Remix GPT!" },
  ];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MessageError = {
  prompt: string;
  message: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MessageError | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useAutoSizeTextArea(textAreaRef.current, value);

  const chatRef = useChatScroll([messages, streamedText]);

  return (
    <div className="container mx-auto space-y-6 px-4">
      <div className="prose mx-auto flex h-screen max-h-screen flex-col">
        <div className="shrink-0">
          <h1 id="chat-title" className="pt-4 text-3xl font-bold">
            Welcome to Remix GPT
          </h1>
        </div>
        <div
          ref={chatRef}
          role="log"
          aria-describedby="chat-title"
          className="grow space-y-6 overflow-auto"
        >
          {messages.map((message) => (
            <MessageItem key={message.id} {...message} />
          ))}
          {isLoading || error ? (
            <MessageItem
              id=""
              role="assistant"
              content={error && !isLoading ? error.message : streamedText}
            />
          ) : null}
        </div>
        <div className="relative shrink-0 py-2">
          {error && !isLoading ? (
            <div className="absolute left-0 top-0 w-full -translate-y-9 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => {
                  const prompt = error.prompt;
                  setStreamedText("");
                  setIsLoading(true);
                  let content = "";
                  const abortController = new AbortController();
                  setAbortController(abortController);
                  handleChatGPTStream({
                    prompt,
                    onData: (data) => {
                      setStreamedText((prev) => {
                        content = prev + data;
                        return prev + data;
                      });
                    },
                    onDone: () => {
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: createId(),
                          role: "assistant",
                          content,
                        },
                      ]);
                      setError(null);
                      setStreamedText("");
                      setIsLoading(false);
                    },
                    onError: (event) => {
                      console.error(event);
                      setError({
                        prompt,
                        message: "Something went wrong. Please try again!",
                      });
                      setIsLoading(false);
                    },
                    signal: abortController.signal,
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                Try Again
              </button>
            </div>
          ) : null}
          {abortController && isLoading && streamedText.length > 0 ? (
            <div className="absolute left-0 top-0 w-full -translate-y-9 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => {
                  abortController.abort();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Stop Generating
              </button>
            </div>
          ) : null}
          <form
            ref={formRef}
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const prompt = formData.get("prompt") as string;
              setMessages((prev) => [
                ...prev,
                {
                  id: createId(),
                  role: "user",
                  content: prompt,
                },
              ]);
              setValue("");
              setIsLoading(true);
              let content = "";
              const abortController = new AbortController();
              setAbortController(abortController);
              handleChatGPTStream({
                prompt,
                onData: (data) => {
                  setStreamedText((prev) => {
                    content = prev + data;
                    return prev + data;
                  });
                },
                onDone: () => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: createId(),
                      role: "assistant",
                      content,
                    },
                  ]);
                  setStreamedText("");
                  setIsLoading(false);
                },
                onError: () => {
                  setError({
                    prompt,
                    message: "Something went wrong. Please try again!",
                  });
                  setIsLoading(false);
                },
                signal: abortController.signal,
              });
            }}
          >
            <div>
              <label htmlFor="prompt" className="sr-only">
                Add your prompt
              </label>
              <div>
                <textarea
                  rows={1}
                  name="prompt"
                  id="prompt"
                  className="block min-h-[40px] w-full resize-none rounded-md border-0 py-2 pr-9 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-300"
                  placeholder="Add your prompt..."
                  ref={textAreaRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <div className="absolute bottom-1 right-1">
              <button
                type="submit"
                className="flex items-center rounded-md p-1 text-indigo-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 active:hover:bg-indigo-200 disabled:opacity-50"
                disabled={!value || isLoading}
              >
                {isLoading ? (
                  <svg
                    className="h-5 w-5 animate-spin p-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ role, content }: Message) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-4">
      <div className="shrink-0">
        <span
          className={`flex rounded p-1 ${
            role === "user"
              ? "bg-indigo-200 text-indigo-900"
              : "bg-green-600 text-green-100"
          }`}
        >
          {role === "user" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          )}
        </span>
      </div>
      <div>
        {content ? (
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p
                  {...props}
                  className="first-of-type:mt-0 last-of-type:mb-0"
                />
              ),
            }}
          />
        ) : (
          <p className="my-0">
            <span className="flex h-7 w-2.5 translate-y-0.5 animate-pulse bg-indigo-300" />
          </p>
        )}
      </div>
    </div>
  );
}

type HandleChatGPTStreamProps = {
  prompt: string;
  onData: (data: string) => void;
  onDone?: () => void;
  onError?: (event: Event) => void;
  signal: AbortSignal;
};

function handleChatGPTStream({
  prompt,
  onData,
  onDone,
  onError,
  signal,
}: HandleChatGPTStreamProps) {
  const eventSource = new EventSource(`/api/chatgpt?prompt=${prompt}`);

  signal.onabort = () => {
    eventSource.close();
    onDone?.();
  };

  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]" || signal.aborted) {
      eventSource.close();
      onDone?.();
    } else {
      const data = JSON.parse(event.data);
      const content = data?.choices?.[0]?.delta?.content;
      if (content) {
        onData(content);
      }
    }
  };

  eventSource.onerror = (event) => {
    console.error(event);
    eventSource.close();
    onError?.(event);
  };
}

const useAutoSizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;

      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};

function useChatScroll(
  dep: React.DependencyList
): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dep]);

  return ref;
}
