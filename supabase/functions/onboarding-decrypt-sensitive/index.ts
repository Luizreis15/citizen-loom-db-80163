import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert string to ArrayBuffer
function stringToBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

// Convert base64 to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to string
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// Derive a CryptoKey from the encryption key
async function getDecryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('ONBOARDING_ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ONBOARDING_ENCRYPTION_KEY not configured');
  }
  
  // Use SHA-256 to derive a 256-bit key from the secret
  const keyMaterial = await crypto.subtle.digest(
    'SHA-256',
    stringToBuffer(keyString)
  );
  
  return await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

// Decrypt a value using AES-GCM
async function decryptValue(encryptedData: string): Promise<string> {
  const key = await getDecryptionKey();
  
  // Decode base64 and split IV from data
  const combined = base64ToBytes(encryptedData);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return bytesToString(new Uint8Array(decryptedData));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { onboarding_instance_id, field_key } = await req.json();

    if (!onboarding_instance_id || !field_key) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: onboarding_instance_id, field_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Decrypting field ${field_key} for onboarding ${onboarding_instance_id} - User: ${user.id}`);

    // Check if user is admin or owner (ONLY admins can decrypt)
    const { data: userRoles } = await supabase
      .rpc('get_user_roles', { _user_id: user.id });
    
    const isAdmin = userRoles?.some((r: { role_name: string }) => 
      r.role_name === 'Owner' || r.role_name === 'Admin'
    );

    if (!isAdmin) {
      console.warn(`Non-admin user ${user.id} attempted to decrypt sensitive field`);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem visualizar dados sensíveis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the encrypted value
    const { data: response, error: fetchError } = await supabase
      .from('onboarding_responses')
      .select('value, is_sensitive')
      .eq('onboarding_instance_id', onboarding_instance_id)
      .eq('field_key', field_key)
      .single();

    if (fetchError || !response) {
      console.error('Field not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Campo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.is_sensitive) {
      // If not sensitive, just return the value as-is
      return new Response(
        JSON.stringify({ value: response.value, encrypted: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the value
    let decryptedValue: string;
    try {
      decryptedValue = await decryptValue(response.value);
    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Falha ao descriptografar. O valor pode estar corrompido.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the access
    await supabase
      .from('onboarding_audit_log')
      .insert({
        onboarding_instance_id,
        field_key,
        action: 'decrypt_sensitive_view',
        user_id: user.id
      });

    console.log(`Admin ${user.id} viewed sensitive field ${field_key}`);

    return new Response(
      JSON.stringify({ value: decryptedValue, encrypted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Error in onboarding-decrypt-sensitive:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
