import { defineStore } from 'pinia'
import type { Todo, TodoCreateDTO } from '@/models/Todo'
import { LocalStorageTodoService, type ITodoService } from '@/services/TodoService'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [] as Todo[],
    loading: false,
    error: null as string | null,
    filter: 'all' as 'all' | 'active' | 'completed',
    categories: ['İş', 'Okul', 'Kişisel', 'Diğer'] as string[],
    selectedCategory: '' as string,
  }),
  getters: {
    filteredTodos: (state) => {
      let result = state.todos;
      if (state.selectedCategory) {
        result = result.filter(todo => todo.category === state.selectedCategory);
      }
      if (state.filter === 'active') {
        result = result.filter(todo => !todo.completed);
      } else if (state.filter === 'completed') {
        result = result.filter(todo => todo.completed);
      }
      return result;
    },
    totalCount: (state) => state.todos.length,
    complatedCount: (state) => state.todos.filter(todo => todo.completed).length,
    activeCount: (state) => state.todos.filter(todo => !todo.completed).length,
  },
  actions: {
    _getTodoServices(): ITodoService {
      return new LocalStorageTodoService()
    },
    async fetchTodos() {
      this.loading = true;
      this.error = null;
      try {
        this.todos = await this._getTodoServices().getTodos();
      }
      catch (error) {
        this.error = 'Görevler getirilirken bir hata oldu.';
        console.error(error, this.error);
      }
      finally {
        this.loading = false;
      }
    },
    async addTodo(todoDTO: TodoCreateDTO) {
      this.loading = true;
      this.error = null;
      try {
        const todo = await this._getTodoServices().addTodo(todoDTO);
        this.todos.push(todo);
      }
      catch (error) {
        this.error = 'Görev eklenirken bir hata oldu.';
        console.error(error, this.error);
      }
      finally {
        this.loading = false;
      }
    },
    async toggleTodo(id: number) {
      if (!id) {
        console.error('Geçersiz ID:', id);
        return;
      }

      try {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) {
          console.error('Todo bulunamadı, ID:', id);
          return;
        }

        const currentTodo = this.todos[todoIndex];
        const newState = !currentTodo.completed;

        this.todos[todoIndex] = { ...currentTodo, completed: newState };

        const updatedTodo = await this._getTodoServices().updateTodo(id, { completed: newState });

        if (updatedTodo) {
          this.todos[todoIndex] = updatedTodo;
        }
      } catch (error) {
        this.error = 'Görev durumu değiştirilirken bir hata oluştu.';
        console.error('Görev durumu değiştirme hatası:', error);
      }
    },
    async deleteTodo(id: number) {
      try {
        const success = await this._getTodoServices().deleteTodo(id);

        if (success) {
          this.todos = this.todos.filter(todo => todo.id !== id);
        }
      } catch (error) {
        this.error = 'Görev silinirken bir hata oluştu.';
        console.error('Görev silme hatası:', error);
      }
    },
    async updateTodo(id: number, todoUpdate: Partial<Todo>) {
      try {
        const updatedTodo = await this._getTodoServices().updateTodo(id, todoUpdate);

        if (updatedTodo) {
          const index = this.todos.findIndex(todo => todo.id === id);
          if (index !== -1) {
            this.todos[index] = updatedTodo;
          }
        }
      } catch (error) {
        this.error = 'Görev güncellenirken bir hata oluştu.';
        console.error('Görev güncelleme hatası:', error);
      }
    },
    setFilter(filter: 'all' | 'active' | 'completed') {
      this.filter = filter;
    },
    setCategory(category: string) {
      this.selectedCategory = category;
    },
    async clearCompleted() {
      const completedTodos = this.todos.filter(todo => todo.completed);
      for (const todo of completedTodos) {
        await this._getTodoServices().deleteTodo(todo.id);
      }
      this.todos = this.todos.filter(todo => !todo.completed);
    }
  }
})