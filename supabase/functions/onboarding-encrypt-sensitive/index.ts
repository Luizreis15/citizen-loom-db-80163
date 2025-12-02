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

// Convert Uint8Array to base64
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Derive a CryptoKey from the encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
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
    ['encrypt']
  );
}

// Encrypt a value using AES-GCM
async function encryptValue(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    stringToBuffer(plaintext)
  );
  
  // Combine IV and encrypted data, then encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return bytesToBase64(combined);
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
    const { onboarding_instance_id, field_key, value, section } = await req.json();

    if (!onboarding_instance_id || !field_key || !value || !section) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: onboarding_instance_id, field_key, value, section' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encrypting field ${field_key} for onboarding ${onboarding_instance_id}`);

    // Verify user has access to this onboarding instance
    const { data: instance, error: instanceError } = await supabase
      .from('onboarding_instances')
      .select('client_id')
      .eq('id', onboarding_instance_id)
      .single();

    if (instanceError || !instance) {
      console.error('Instance not found:', instanceError);
      return new Response(
        JSON.stringify({ error: 'Onboarding não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or owner of this onboarding
    const { data: userRoles } = await supabase
      .rpc('get_user_roles', { _user_id: user.id });
    
    const isAdmin = userRoles?.some((r: { role_name: string }) => 
      r.role_name === 'Owner' || r.role_name === 'Admin'
    );

    // If not admin, check if user is the client
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!profile || profile.client_id !== instance.client_id) {
        return new Response(
          JSON.stringify({ error: 'Sem permissão para acessar este onboarding' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Encrypt the value
    const encryptedValue = await encryptValue(value);

    // Upsert the response with encrypted value
    const { error: upsertError } = await supabase
      .from('onboarding_responses')
      .upsert({
        onboarding_instance_id,
        field_key,
        section,
        value: encryptedValue,
        is_sensitive: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'onboarding_instance_id,field_key'
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar dados criptografados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the action (without the value)
    await supabase
      .from('onboarding_audit_log')
      .insert({
        onboarding_instance_id,
        field_key,
        action: 'encrypt_sensitive',
        user_id: user.id
      });

    console.log(`Successfully encrypted field ${field_key}`);

    return new Response(
      JSON.stringify({ success: true, encrypted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Error in onboarding-encrypt-sensitive:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
