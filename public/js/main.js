
function toggleAIBox() {
    const aiBox = document.getElementById("ai-box");
    if (aiBox.style.display === "none" || aiBox.style.display === "") {
        aiBox.style.display = "block";
    } else {
        aiBox.style.display = "none";
    }
}


const handleFormSubmit = async (event) => {
    // Prevent the form from submitting and reloading the page
    event.preventDefault();

    
    // Get the value of the 'topic' input field
    const topic = document.getElementById("ai-topic").value.trim();

    // Check if the topic is empty
    if (!topic) {
        alert("Please enter a topic or keywords.");
        return;
    }

    const loader = document.getElementById("loader");
    loader.style.display = "block";

    // Prepare the data to send in the request body
    const formData = { topic };

    try {
        // Send the POST request to the server's /generate-ai route
        const response = await axios.post("/generate-ai", formData);
        
        
        
        // Check if the response status is 200 (successful)
        if (response.status === 200) {
            loader.style.display = "none";

            const data = response.data; // Access the response data
             
            // Update the AI box UI with the generated content
            const aiBox = document.getElementById("ai-box");
            aiBox.style.width = "650px";
            aiBox.style.padding = "20px";
            aiBox.style.height = "600px";

            const generateHeading = document.getElementById("generated-heading");
            
            generateHeading.textContent = "Generated Content";

            const generatedMsgDiv = document.getElementById("generated-msg");
            
            // Clear previous content
            generatedMsgDiv.innerHTML = "";

            // Split the response text by newline and add each line as a <p>
            const lines = data.generatedText.split("\n");
            lines.forEach((line) => {
                const paragraph = document.createElement("p");
                paragraph.textContent = line;
                generatedMsgDiv.appendChild(paragraph);
            });
            generatedMsgDiv.style.display = "block"; // Make the message box visible
        } else {
            alert("Failed to generate content. Please try again.");
        }
    } catch (error) {
        // Show error message in the UI
        const generatedMsgDiv = document.getElementById("generated-msg");
        generatedMsgDiv.textContent = "An error occurred while generating content.";
        generatedMsgDiv.classList.remove("success");
        generatedMsgDiv.classList.add("error");
        generatedMsgDiv.style.display = "block"; // Make the message box visible
    }
};


