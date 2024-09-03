
section .data
    message db '125', 10  ; String with newline character, ASCII 10
    len equ $ - message             ; Calculate length of the string

section .text
    global _start

_start:
    ; sys_write (stdout = 1, message, length)
    mov eax, 4          ; sys_write syscall number (4)
    mov ebx, 1          ; File descriptor 1 (stdout)
    mov ecx, message    ; Pointer to the message
    mov edx, len        ; Length of the message
    int 0x80            ; Make the syscall

    ; sys_exit (status = 0)
    mov eax, 1          ; sys_exit syscall number (1)
    xor ebx, ebx        ; Exit status 0
    int 0x80            ; Make the syscall
