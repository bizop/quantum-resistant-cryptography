import numpy as np

def generate_keypair(n=10, q=101, std_dev=3.2):
    """
    Generates a public and private keypair.
    
    Parameters:
    - n: dimension of the secret vector.
    - q: modulus for the operations.
    - std_dev: standard deviation for the error distribution.
    
    Returns:
    - Public key (A, b) and private key s.
    """
    A = np.random.randint(low=0, high=q, size=(n, n))
    s = np.random.randint(low=0, high=q, size=(n, 1))
    e = np.random.normal(loc=0, scale=std_dev, size=(n, 1)).astype(int) % q
    b = (A @ s + e) % q
    return (A, b), s

def encrypt(message, public_key, q=101, n=10):
    """
    Encrypts a message using the public key.
    
    Parameters:
    - message: the message to encrypt, must be a binary vector of dimension n.
    - public_key: the public key (A, b).
    - q: modulus for the operations.
    - n: dimension of the secret vector.
    
    Returns:
    - Encrypted message (u, v).
    """
    A, b = public_key
    m = np.array(message).reshape((n, 1))
    r = np.random.randint(0, 2, size=(n, 1))  # Random binary vector
    u = (A.T @ r) % q
    v = (b.T @ r + np.dot(m.T, np.ones((n, 1)) * q/2)) % q
    return u, v

def decrypt(encrypted_message, private_key, q=101, n=10):
    """
    Decrypts an encrypted message using the private key.
    
    Parameters:
    - encrypted_message: the message to decrypt (u, v).
    - private_key: the private key s.
    - q: modulus for the operations.
    - n: dimension of the secret vector.
    
    Returns:
    - Decrypted message.
    """
    u, v = encrypted_message
    s = private_key
    decryption_attempt = (v - u.T @ s) % q
    decrypted_message = np.round(2 * decryption_attempt / q) % 2
    return decrypted_message.flatten()

# Example usage
public_key, private_key = generate_keypair()
message = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]  # Example message
encrypted_message = encrypt(message, public_key)
decrypted_message = decrypt(encrypted_message, private_key)
print("Original Message: ", message)
print("Decrypted Message: ", decrypted_message)
