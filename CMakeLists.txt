cmake_minimum_required(VERSION 3.10)
project(ChessGame CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

file(GLOB_RECURSE SOURCES
    main.cpp
    src/*.cpp
    src/AI/*.cpp
    src/UI/*.cpp
)

add_executable(chess ${SOURCES})