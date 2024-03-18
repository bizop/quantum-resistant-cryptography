import numpy as np

# Parameters
MEAN = 0
STD_DEV = 2.56
N = 128
Q = 256

def random_normal(mean=MEAN, std_dev=STD_DEV, n=N):
    """
    Generates random numbers according to the normal distribution.
    """
    return np.random.normal(mean, std_dev, n)

def string_to_binary(input_str):
    """
    Converts a string to a binary string.
    """
    return ''.join(format(ord(c), '08b') for c in input_str)

def binary_to_string(input_binary):
    """
    Converts a binary string back to a string.
    """
    return ''.join(chr(int(input_binary[i:i+8], 2)) for i in range(0, len(input_binary), 8))

def generate_keypair(n=N, q=Q, std_dev=STD_DEV):
    """
    Generates a public-private keypair for encryption and decryption.
    """
    A = np.random.randint(low=0, high=q, size=(n, n))
    s = np.random.randint(low=0, high=q, size=(n, 1))
    e = np.round(random_normal(0, std_dev, n)).reshape(n, 1) % q
    b = (A @ s + e) % q
    return (A, b), s

def encrypt(message, public_key, q=Q, n=N):
    """
    Encrypts a message using the public key.
    """
    binary_message = string_to_binary(message)
    binary_array = np.array(list(map(int, binary_message)))
    message_length = len(binary_array)
    padded_message = np.concatenate([binary_array, np.zeros(n - (message_length % n))])
    
    encrypted_message_parts = []
    for i in range(0, len(padded_message), n):
        message_part = padded_message[i:i+n].reshape(n, 1)
        A, b = public_key
        r = np.random.randint(0, 2, size=(n, 1))
        u = (A.T @ r) % q
        v = ((b.T @ r) + (message_part.T * q/2)) % q
        encrypted_message_parts.append((u, v))
    
    return encrypted_message_parts, message_length

def decrypt(encrypted_data, private_key, q=Q, n=N):
    """
    Decrypts an encrypted message using the private key.
    """
    encrypted_message_parts, original_length = encrypted_data
    decrypted_binary_array = np.array([])
    
    for u, v in encrypted_message_parts:
        s = private_key
        decryption_attempt = (v - u.T @ s) % q
        decrypted_message_part = np.round(2 * decryption_attempt / q) % 2
        decrypted_binary_array = np.concatenate([decrypted_binary_array, decrypted_message_part.flatten()])
    
    decrypted_binary_string = ''.join(map(str, decrypted_binary_array.astype(int)[:original_length]))
    return binary_to_string(decrypted_binary_string)

# Example usage
public_key, private_key = generate_keypair()
message = "Hello, Quantum World!"
encrypted_message, original_length = encrypt(message, public_key)
decrypted_message = decrypt((encrypted_message, original_length), private_key)

print("Original Message: ", message)
print("Encrypted Message: ", encrypted_message)
print("Decrypted Message: ", decrypted_message)
