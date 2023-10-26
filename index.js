const  qs = require('qs');

let currentTrade = {};
let currentSelectSide;

async function listAvailableTokens(){
    console.log("initializing");
    let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
    let tokenListJSON = await response.json();
    console.log("listing available tokens: ", tokenListJSON);
    tokens = tokenListJSON.tokens
    console.log("tokens:", tokens);
  
    // Create a token list for the modal
    let parent = document.getElementById("token_list");
    // Loop through all the tokens inside the token list JSON object
    for (const i in tokens){
      // Create a row for each token in the list
      let div = document.createElement("div");
      div.className = "token_row";
      // For each row, display the token image and symbol
      let html = `
      <img class="token_list_img" src="${tokens[i].logoURI}">
        <span class="token_list_text">${tokens[i].symbol}</span>
        `;
      div.innerHTML = html;
    //   Where the sect token will be selected.
    // selectToken() will be called when a token is clicked
    div.onclick = () => {
        selectToken(tokens[i]);
    };
      parent.appendChild(div);
    }
  }

async function connect() {
    /**
     * Metamask injects a global API into websites visited by its users at `window.ethereum`
     * This API allows websites to request users' Ethereum accounts, read data from blockchains the user is connected to,
     * and suggest that the user sign messages and transactions.
     * The presence of the provider object indicates an Ethereum user.
     * Read https://ethereum.stackexchange.com/a/68294/85979 
     */

    // Check if metamask is installed, if yes try connecting to an account.
    if(typeof window.ethereum !== "undefined") {
        try {
            console.log("connecting");
            // Requests that the user provides an Ethereum address to be identified by. 
            // The request causes a Metamask popup to appear.
            // Read more: https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
            await ethereum.request({method: "eth_requestAccounts"});
        }catch(error){
            console.log(error);

        }
        // If connected, change Button to "Connected"
        document.getElementById("login_button").innerHTML = "Connected";
        // If connected, enable "Swap" button
        document.getElementById("swap_button").disabled = "false";
    }
    // Ask user to install Metamask if it is not detected.
    else {
        document.getElementById("login_button").innerHTML = "Please Install Metamask";
    }
}

// The call to automatically call init function.
listAvailableTokens();

// Call the connect function when the login_button is clicked
document.getElementById("login_button").onclick = connect;
// Call the openModal function when SELET A TOKEN BUTTON IS CLICKED whose Id is "from_token_select"
document.getElementById("from_token_select").onclick = () => {
    openModal("from");
};
// A call from the second Select token Button must also open the modal.
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
// Call the closeModal function to close the modal once the x button is clicked.
document.getElementById("modal_close").onclick = closeModal;
// On blur in the document
document.getElementById("from_amount").onblur = getPrice;


function openModal(side){
    // Store whether a user has selected a token on the from or to side
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}
function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}
function selectToken(token) {
    // When the token is selected, Automatically close the modal.
    closeModal();
    // Track which side of the trade we are on -from/to
    currentTrade[currentSelectSide] = token;
    // Log the selected token
    console.log("currentTrade", currentTrade);
    renderInterface();
}

// Function to display the image and token Symbol.
function renderInterface(){
    if(currentTrade.from) {
        console.log(currentTrade.from) ;
            // Set the from token image
            document.getElementById("from_token_img").src = currentTrade.from.logoURI;
            // Set the from token symbol text
            document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
        
    }
    if(currentTrade.to) {
        // Set the to token image
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        // Set the to token Symbol text
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}

async function getPrice(){
    console.log("Getting Price");
    // Only fetch price if from token, to token, and from token amount have been filled in
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    
    //  The amount is calculated from the smallest base unit of the token. We get this by multiplying the
    //  from amount) x (10 to the power of the number of decimal places )
    let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    // Now we set params and fill them into our price quote
    const params = {
        sellToken: currentTrade.from.address,
        buyToken: currentTrade.to.address,
        sellAmount: amount,
    }
    // Fetch the swap price
    const response = await fetch(
        `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );
    // Await and parse the JSON response
    swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);
    // Use the returned value to populate the buy amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
  }
  

