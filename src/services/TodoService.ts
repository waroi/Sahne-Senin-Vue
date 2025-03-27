import type { Todo, TodoCreateDTO } from '../models/Todo'

export interface ITodoService {
  getTodos(): Promise<Todo[]>
  getTodoById(id: number): Promise<Todo | undefined>
  addTodo(todo: TodoCreateDTO): Promise<Todo>
  updateTodo(id: number, todo: Partial<Todo>): Promise<Todo | undefined>
  deleteTodo(id: number): Promise<boolean>
  toggleComplete(id: number): Promise<Todo | undefined>
}

export class LocalStorageTodoService implements ITodoService {
  private STORAGE_KEY = 'todos';

  private getStoredTodos(): Todo[] {
    try {
      const storage = window.localStorage || localStorage
      if (!storage) {
        console.error('LocalStorage is not available')
        return []
      }
      const storedTodos = storage.getItem(this.STORAGE_KEY)
      if (!storedTodos) {
        return []
      }
      const todos = JSON.parse(storedTodos, (key, value) => {
        if (key === 'createdAt') {
          return new Date(value)
        }
      })
      return Array.isArray(todos) ? todos : [];
    }
    catch (error) {
      console.error('Error retrieving todos from localStorage:', error)
      return []
    }
  }
  private saveTodos(todos: Todo[]): void {
    try {
      const storage = window.localStorage || localStorage
    if (!storage) {
      console.error('LocalStorage is not available')
      return
    }
    storage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
    }
    catch (error) {
      console.error('Error saving todos to localStorage:', error)
    }
  }
  async getTodos(): Promise<Todo[]> {
    return Promise.resolve(this.getStoredTodos())
  }
  async getTodoById(id: number): Promise<Todo | undefined> {
    const todos = this.getStoredTodos()
    return Promise.resolve(todos.find(todo => todo.id === id))
  }
  async addTodo(todoDTO: TodoCreateDTO): Promise<Todo> {
    const todos = this.getStoredTodos()
    const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1

    const newTodo: Todo = {
      ...todoDTO,
      id: newId,
      createdAt: new Date()
    }
    todos.push(newTodo)
    this.saveTodos(todos)
    return Promise.resolve(newTodo)
  }
  async updateTodo(id: number, todoUpdate: Partial<Todo>): Promise<Todo | undefined> {
    try {
      const todos = this.getStoredTodos()
      const index = todos.findIndex(todo => todo.id === id)
      if (index === -1) {
        return Promise.resolve(undefined)
      }
      todos[index] = { ...todos[index], ...todoUpdate }
      this.saveTodos(todos)
      return Promise.resolve(todos[index])
    }
    catch (error) {
      console.error('Error updating todo:', error)
      return Promise.resolve(undefined)
    }
  }
  async deleteTodo(id: number): Promise<boolean> {
    const todos = this.getStoredTodos()
    const index = todos.findIndex(todo => todo.id === id)
    if (index === -1) {
      return Promise.resolve(false)
    }
    todos.splice(index, 1)
    this.saveTodos(todos)
    return Promise.resolve(true)
  }
  async toggleComplete(id: number): Promise<Todo | undefined> {
    try {
      console.log('toggleComplete çağrıldı, id:', id);
      const todos = this.getStoredTodos();
      console.log('Mevcut todos:', todos);

      const todo = todos.find(todo => todo.id === id);

      if (!todo) {
        console.log('Todo bulunamadı');
        return Promise.resolve(undefined);
      }

      console.log('Tamamlanma durumu değiştiriliyor:', todo.completed, ' -> ', !todo.completed);
      const result = await this.updateTodo(id, { completed: !todo.completed });
      console.log('Güncellenen todo:', result);
      return result;
    } catch (error) {
      console.error('toggleComplete hatası:', error);
      return Promise.resolve(undefined);
    }
  }
}