import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/openai';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Verify authentication
    const cookieStore = cookies();
    const supabaseToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = supabase;
    
    // Verify chat ownership
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: chatData, error: chatError } = await supabaseClient
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', userData.user.id)
      .single();

    if (chatError || !chatData) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 403 }
      );
    }

    // Generate AI response
    const aiResponse = await generateChatCompletion(messages);

    // Save AI response to database
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'assistant',
          content: aiResponse || 'I apologize, but I was unable to generate a response.',
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Error inserting AI response:', insertError);
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
