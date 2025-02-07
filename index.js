async function main(input) {
  const url = "https://openai-embedding-worker.vvovsen.workers.dev/";
  const body = { input: input };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

  const embedding = await response.json()
  return embedding;
  } catch (error) {
    console.log(error)
    return null;
  }
}

async function searchDB(database, count, threshhold, input) {
  const url = "https://supabase-vector-worker.vvovsen.workers.dev/";
  const requestBody = {
    database: database,
    match_count: count,
    match_threshold: threshhold,
    query_embedding: input
  }
  const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  const vectors = await response;
  return vectors;
}

async function sendMessage(input){
  const textInput = input;
  const url = "https://openai-api-worker.vvovsen.workers.dev/"
  const textToVector = await main(textInput);
  const vectorReply = await searchDB('match_movie_self_study',4,0.5,textToVector);
  const messages = [
    {
      "role": "system",
      "content": "You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to:\n1. Formulate a short, friendly answer to the question using the provided context.\n1. If the question is unclear or unrelated to the context:\nSuggest an alternative if the context is unrelated to the query.\n2.If you are unsure and cannot find the answer in the context or conversation history, say, 'Sorry, I don't know the answer.'\nAlways speak as if you were chatting with a friend. Do not make up the answer."
    },
    {
      "role": "user",
      "content": `Context: ${await vectorReply} User input: ${textInput}`
    }
  ]
  const fetchBody = {
    "model": "gpt-4o",
    "messages": messages,
    "temperature": 0.65,
    "presence_penalty": 0,
    "frequency_penalty": 0.55
  }
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(fetchBody)
  })
  const data = await response.json()
  return data;
}

async function loadHandler(input, element){
    const testResponse = await sendMessage(input);
    element.innerHTML = `<textarea id="resultOutput" class="inputField">${testResponse.content}</textarea>`
    funcButt.innerText = "Try again!"
}

function printFields(){
  const style = document.createElement('style');
  document.head.appendChild(style);
  let emptyFound = false;
  const favMov = document.getElementById("favMov");
  const newClass = document.getElementById("newClass");
  const funSer = document.getElementById("funSer");
  const emptyCheck = [{
    "name": "favMov", "content": favMov.value
  },{
    "name": "newClass", "content": newClass.value
  },{
    "name": "funSer", "content": funSer.value
  }]
  emptyCheck.map((field) => {
    if(field.content === ""){
      emptyFound = true;
      style.innerHTML += `
        #${field.name}::placeholder {
            color: red;
        }
      `
      return;
    }
  });
  
  if(!emptyFound){
    const suggestionString = `Favourite: ${favMov.value}\n Mood: ${newClass.value}\n Serious: ${funSer.value}`;
    const container = document.getElementById("content")
    container.innerHTML = `<img class="loader" src="files/loading.gif">
    <h1>Loading result</h1>`;
    funcButt.onclick = "location.reload()";
    funcButt.innerText = "Please wait";
    loadHandler(suggestionString, container);
  }
}

const funcButt = document.getElementById("funcButt");
funcButt.onclick = printFields;