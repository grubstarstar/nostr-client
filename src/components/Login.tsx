export function Login() {
  return (
    <div>
      <form method="post">
        <div>Enter the private key of your identity</div>
        <input type="text" placeholder="private key" name="privkey" />
        <input type="submit" title="Submit" />
      </form>
    </div>
  );
}
