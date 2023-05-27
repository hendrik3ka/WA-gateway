const phoneNumberFormatter = (number?: any) => {
    if (!number) {
        throw new Error('Invalid number. Number is undefined.');
      }
    if (number.endsWith("@s.whatsapp.net")) return number;
    if (number.endsWith("@g.us")) return number;
    if (number.includes("-")) {
        return number + "@g.us";
    }
    const phone = number.replace(/\D/g, "");
    if (phone.startsWith("08")) {
        const slice = phone.slice(1);
        return `62${slice}@s.whatsapp.net`;
    } else {
        return phone + "@s.whatsapp.net";
    }
};
export { phoneNumberFormatter }