
public class SampleClass {
    private String message;
    
    public SampleClass() {
        this("Default Message");
    }
    
    public SampleClass(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public void printMessage() {
        System.out.println(message);
    }
    
    public static void main(String[] args) {
        SampleClass sample = new SampleClass("Hello from Java!");
        sample.printMessage();
    }
}
