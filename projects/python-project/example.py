class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f"Hello, my name is {self.name} and I am {self.age} years old."

def add_numbers(a: int, b: int) -> int:
    return a + b

def main():
    # Create a new person instance
    person_name = "Alice"
    person_age = 30
    person = Person(person_name, person_age)

    # Greet the person
    greeting_message = person.greet()
    print(greeting_message)

    # Add two numbers
    num1 = 5
    num2 = 10
    sum_result = add_numbers(num1, num2)
    sum_result2 = add_numbers(num1, num1)
    print(f"The sum of {num1} and {num2} is {sum_result}.")

if __name__ == "__main__":
    main()