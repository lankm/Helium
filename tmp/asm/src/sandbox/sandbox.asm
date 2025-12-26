; nasm -f elf32 -o sandbox.o sandbox.asm
; ld -m elf_i386 -o sandbox.exe sandbox.o

global main
extern printf


section .text
main:
    ; Align the stack to 16 bytes
    ; The call pushes 8 bytes, so subtract 8 more to keep alignment
    sub rsp, 8

    ; Set up arguments for printf
    lea rdi, [rel message]   ; format string
    lea rsi, [rel name]  ; argument for %s
    xor eax, eax         ; clear RAX (required for variadic functions)
    call printf

    add rsp, 8           ; restore stack
    ret

section .data
    message: db "Hello %s!", 10, 0
    name: db "World", 0
