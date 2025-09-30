export function decodeJWT() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        // JWT üç parçadan oluşur: header.payload.signature
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;

        // Base64 decode
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        return payload; // örn: { id: "userId123", email: "...", ... }
    } catch (err) {
        console.error("JWT decode error:", err);
        return null;
    }
}