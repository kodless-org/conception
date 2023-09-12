const operations = [
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Get Users",
    endpoint: "/api/users",
    method: "GET",
    fields: {},
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "textarea" },
  },
  {
    name: "Get Posts",
    endpoint: "/api/posts",
    method: "GET",
    fields: {},
  },
];

const API_URL = "http://localhost:3000";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

async function request(method: HttpMethod, endpoint: string, body?: unknown) {
  try {
    const res = fetch(API_URL + endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
    return await (await res).json();
  } catch (e) {
    console.log(e);
    return { error: "Something went wrong, check your console log." };
  }
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${Object.entries(operation.fields)
          .map(([name, type]) => {
            return `<div class="field">
              <label for="${name}">${name}</label>
              <${type} name="${name}" id="${name}"></${type}>
            </div>`;
          })
          .join("")}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) =>
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));
      const response = await request($method as HttpMethod, $endpoint as string, Object.keys(reqData).length > 0 ? reqData : undefined);
      document.querySelector("#response-text")!.innerHTML = JSON.stringify(response, null, 2);
    }),
  );
});
