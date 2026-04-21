const Message = require('../models/Message');
const Chat = require('../models/Chat');

 
const getAIResponse = async (chatId, userMessage) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        console.warn('⚠️ GROQ_API_KEY not found in .env');
        return "I'm sorry, my AI brain isn't connected right now. Please check the API key!";
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",  
                messages: [
                    { 
                        role: "system", 
                        content: "You are Kimi AI, a helpful, friendly, and professional assistant inside the KimiChat app. Your goal is to help users with their tasks and have meaningful conversations. Keep your replies concise but warm." 
                    },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Groq API Error:', data);
            return "I'm having a bit of trouble thinking right now. Could you try again in a moment?";
        }

        return data.choices[0]?.message?.content || "I'm not sure what to say to that!";
    } catch (err) {
        console.error('AI Service Error:', err);
        return "Oops! I ran into an error while processing your request.";
    }
};

 
const triggerAIReply = async (io, chatId, query) => {
    console.log(`🤖 AI Triggered for chat ${chatId}: "${query}"`);
     
    if (io) {
        io.to(`chat:${chatId}`).emit('message:typing', { 
            chatId, 
            userId: 'ai-bot', 
            userName: 'Kimi AI', 
            isTyping: true 
        });
    }

     
    await new Promise(r => setTimeout(r, 1500));

     
    const aiText = await getAIResponse(chatId, query);
    console.log(`🤖 AI Reply generated: "${aiText.substring(0, 30)}..."`);

     
    if (io) {
        io.to(`chat:${chatId}`).emit('message:typing', { 
            chatId, 
            userId: 'ai-bot', 
            isTyping: false 
        });
    }

     
    const aiMessage = await Message.create({
        chat: chatId,
        sender: null, 
        content: aiText,
        type: 'text',
        isAI: true,
        readBy: []
    });

    const populated = await Message.findById(aiMessage._id).populate('chat');
    console.log(`🤖 AI Message Created in DB. Emitting to chat:${chatId}...`);

     
    if (io) {
        const result = io.to(`chat:${chatId}`).emit('message:new', { 
            chatId, 
            message: populated.toObject() 
        });
        console.log(`🤖 AI Emit Result: ${result ? 'Success' : 'Failed'}`);
    }




     
    await Chat.findByIdAndUpdate(chatId, {
        lastMessage: aiMessage._id,
        updatedAt: new Date()
    });

    return populated;
};

module.exports = { getAIResponse, triggerAIReply };
